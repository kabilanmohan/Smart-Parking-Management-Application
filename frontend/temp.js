import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
  };


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const parkingSpaceRef = doc(db, "ParkingSpaces", "6RP0aHOIiZMgVj7zsKMp");

const parkingSlotData = {
    parkingSpaceID: parkingSpaceRef, // Firestore reference
    levels: {
        "1": {
            grid: [
                { row: 0, cols: [0, 1, 1, 1, 0] },  
                { row: 1, cols: [1, 2, 2, 3, 1] },  
                { row: 2, cols: [1, 2, 3, 3, 1] },  
                { row: 3, cols: [0, 1, 1, 1, 0] }   
            ],
            availability: [
                { row: 0, cols: [true, true, true, true, true] },
                { row: 1, cols: [true, false, false, false, true] },
                { row: 2, cols: [true, false, false, false, true] },
                { row: 3, cols: [true, true, true, true, true] }
            ],
            prices: [
                { row: 0, cols: [0, 0, 0, 0, 0] },
                { row: 1, cols: [0, 5, 5, 3, 0] },
                { row: 2, cols: [0, 5, 3, 3, 0] },
                { row: 3, cols: [0, 0, 0, 0, 0] }
            ]
        }
    },
    updatedAt: new Date()
};

async function createParkingSlot() {
    try {
        await setDoc(doc(db, "ParkingSlots", "parkingSlot123"), parkingSlotData);
        console.log("✅ Parking slot document successfully created with reference!");
    } catch (error) {
        console.error("❌ Error adding document: ", error);
    }
}


createParkingSlot();