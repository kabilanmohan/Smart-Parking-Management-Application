const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

// Initialize the app if it hasn"t been initialized already
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

exports.checkoutExpiredBookings = onSchedule({
  schedule: "every 15 minutes",
  timeZone: "UTC",
  retryConfig: {
    maxRetryAttempts: 3,
  },
}, async () => {
  const now = admin.firestore.Timestamp.now();
  console.log("Running scheduled function to check expired bookings at:",
    now.toDate());

  try {
    // First, let"s examine an active booking with slot details to understand structure
    const activeSlotsQuery = db.collection("bookings")
      .where("status", "==", "active")
      .limit(1);
    
    const activeSnapshot = await activeSlotsQuery.get();
    if (!activeSnapshot.empty) {
      const sampleBooking = activeSnapshot.docs[0].data();
      console.log("Sample active booking structure:", {
        id: activeSnapshot.docs[0].id,
        slotDetails: JSON.stringify(sampleBooking.slotDetails || {}),
        // Show the types of data fields
        slotDetailsType: sampleBooking.slotDetails ? 
            Object.entries(sampleBooking.slotDetails).map(([k,v]) => `${k}:${typeof v}`).join(", ") : "undefined"
      });
    }

    // Query bookings with status "active" and checkoutTime < now
    const expiredBookingsQuery = db.collection("bookings")
      .where("status", "==", "active")
      .where("checkoutTime", "<", now);

    const expiredBookingsSnapshot = await expiredBookingsQuery.get();
    console.log(`Found ${expiredBookingsSnapshot.size} expired bookings`);
    
    if (expiredBookingsSnapshot.empty) {
      return null;
    }

    // Process each expired booking
    const batch = db.batch();
    // To track which spaces need AvailableSlots update
    const processedParkingSpaces = new Map(); 

    for (const bookingDoc of expiredBookingsSnapshot.docs) {
      const bookingData = bookingDoc.data();
      const bookingId = bookingDoc.id;
      
      console.log(`Processing expired booking: ${bookingId}`, 
        JSON.stringify({
          parkingSpaceId: bookingData.parkingSpaceId,
          slotDetails: bookingData.slotDetails
        }));
      
      // Update booking status to "completed"
      batch.update(bookingDoc.ref, {status: "completed"});
      
      // If booking has slot details, update the ParkingSlots to mark as available
      if (bookingData.parkingSpaceId && bookingData.slotDetails) {
        const {level, row, col} = bookingData.slotDetails;
        console.log(`Slot details: level=${level} (${typeof level}), row=${row} (${typeof row}), col=${col} (${typeof col})`);
        
        const parkingSlotsRef = db.doc(
          `ParkingSlots/${bookingData.parkingSpaceId}`);
        
        // Get current ParkingSlots data
        const parkingSlotsDoc = await parkingSlotsRef.get();
        
        if (parkingSlotsDoc.exists) {
          const parkingSlotsData = parkingSlotsDoc.data();
          console.log(`Found ParkingSlots document with levels:`, 
            Object.keys(parkingSlotsData.levels || {}));
          
          // Make sure required paths exist
          if (parkingSlotsData.levels && 
              parkingSlotsData.levels[level] && 
              parkingSlotsData.levels[level].availability) {
            
            console.log(`Level ${level} exists with availability rows:`, 
              parkingSlotsData.levels[level].availability.map(r => `rows: ${r.rows} (${typeof r.rows})`));
            
            // Convert row to the proper type based on what"s in the database
            let rowToFind = row;
            // Check if we need to convert to number
            const firstRow = parkingSlotsData.levels[level].availability[0];
            if (firstRow && typeof firstRow.rows === "number" && typeof row === "string") {
              rowToFind = parseInt(row, 10);
              console.log(`Converting row from string to number: ${row} -> ${rowToFind}`);
            }
            // Check if we need to convert to string
            else if (firstRow && typeof firstRow.rows === "string" && typeof row === "number") {
              rowToFind = row.toString();
              console.log(`Converting row from number to string: ${row} -> ${rowToFind}`);
            }
            
            // Find the row in availability data - with proper type handling
            const availabilityRow = parkingSlotsData.levels[level]
              .availability.find((r) => r.rows === rowToFind);
            
            if (availabilityRow) {
              console.log(`Found availability row with rows=${rowToFind}. Columns:`, 
                Object.keys(availabilityRow.cols || {}));
              
              // Also handle col type conversion if needed
              let colToUse = col;
              if (typeof colToUse === "number" && !Object.prototype.hasOwnProperty.call(availabilityRow.cols, colToUse)) {
                colToUse = colToUse.toString();
                console.log(`Converting col from number to string: ${col} -> ${colToUse}`);
              } 
              else if (typeof colToUse === "string" && !Object.prototype.hasOwnProperty.call(availabilityRow.cols, colToUse)) {
                colToUse = parseInt(colToUse, 10);
                console.log(`Converting col from string to number: ${col} -> ${colToUse}`);
              }
              
              if (availabilityRow.cols && 
                  Object.prototype.hasOwnProperty.call(availabilityRow.cols, colToUse)) {
                console.log(`Found column ${colToUse} in availability data. Current status:`, 
                  availabilityRow.cols[colToUse]);
                
                // Create deep copy for Firestore nested objects
                const updatedData = JSON.parse(
                  JSON.stringify(parkingSlotsData));
                
                // Find the row in the copied data
                const updatedRow = updatedData.levels[level].availability
                  .find((r) => r.rows === rowToFind);
                
                if (updatedRow) {
                  // Update the slot to be available
                  updatedRow.cols[colToUse] = {
                    ...availabilityRow.cols[colToUse],
                    isOccupied: false,
                    bookingId: "",
                  };
                  
                  console.log(`Updated slot to:`, updatedRow.cols[colToUse]);
                  
                  // Update the ParkingSlots document
                  batch.update(parkingSlotsRef, updatedData);
                  console.log(`Added update for ParkingSlots/${bookingData.parkingSpaceId} to batch`);
                  
                  // Track this parking space to update its available slots count
                  if (!processedParkingSpaces.has(bookingData.parkingSpaceId)) {
                    processedParkingSpaces.set(bookingData.parkingSpaceId, 0);
                  }
                  processedParkingSpaces.set(
                    bookingData.parkingSpaceId, 
                    processedParkingSpaces.get(bookingData.parkingSpaceId) + 1
                  );
                } else {
                  console.error(`Failed to find row in copied data. This shouldn"t happen.`);
                }
              } else {
                console.error(`Column ${col}/${colToUse} not found in availability row. Available cols:`, 
                  Object.keys(availabilityRow.cols || {}));
              }
            } else {
              console.error(`Row ${row}/${rowToFind} not found in availability data. Available rows:`, 
                parkingSlotsData.levels[level].availability.map(r => r.rows));
            }
          } else {
            console.error(`Required structure not found in ParkingSlots document:
              - levels: ${!!parkingSlotsData.levels}
              - levels[${level}]: ${parkingSlotsData.levels ? !!parkingSlotsData.levels[level] : false}
              - levels[${level}].availability: ${
                parkingSlotsData.levels && parkingSlotsData.levels[level] ? 
                !!parkingSlotsData.levels[level].availability : false
              }`);
          }
        } else {
          console.error(`ParkingSlots document not found for ID: ${bookingData.parkingSpaceId}`);
        }
      } else {
        console.log(`Booking ${bookingId} doesn"t have parkingSpaceId or slotDetails`);
      }
    }
    
    // Update ParkingSpaces AvailableSlots counts for affected spaces
    for (const [parkingSpaceId, incrementBy] of processedParkingSpaces) {
      const parkingSpaceRef = db.doc(`ParkingSpaces/${parkingSpaceId}`);
      const parkingSpaceDoc = await parkingSpaceRef.get();
      
      if (parkingSpaceDoc.exists) {
        const spaceData = parkingSpaceDoc.data();
        const currentAvailableSlots = spaceData.AvailableSlots || 0;
        batch.update(parkingSpaceRef, {
          AvailableSlots: currentAvailableSlots + incrementBy,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Added update for ParkingSpaces/${parkingSpaceId} to batch. 
          AvailableSlots: ${currentAvailableSlots} -> ${currentAvailableSlots + incrementBy}`);
      }
    }
    
    // Log batch size before committing
    console.log(`Batch contains ${batch._ops ? batch._ops.length : "unknown"} operations`);
    
    // Commit all the updates in a batch
    await batch.commit();
    
    console.log(`Successfully processed ${expiredBookingsSnapshot.size} expired bookings`);
    return null;
  } catch (error) {
    console.error("Error processing expired bookings:", error);
    return null;
  }
});