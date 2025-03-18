import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDe6y6m73axNAjBfMxaY-BiP9vy0Qtt_so",
    authDomain: "smart-parking-applicatio-566ed.firebaseapp.com",
    projectId: "smart-parking-applicatio-566ed",
    storageBucket: "smart-parking-applicatio-566ed.firebasestorage.app",
    messagingSenderId: "924586559087",
    appId: "1:924586559087:web:86cc158807866fe49e2f9a",
    measurementId: "G-PZ7KT7F4RC"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const parkingSpaceRef = doc(db, "ParkingSpaces", "6RP0aHOIiZMgVj7zsKMp");

const parkingSlotData = {
    parkingSpaceID: parkingSpaceRef, // Firestore reference
    levels: {
        "1": {
            grid: [
                { row: 0, cols: [0, 1, 1, 1, 1, 1, 1, 1, 1, 0] },  
                { row: 1, cols: [1, 2, 2, 1, 3, 3, 1, 2, 2, 1] },  
                { row: 2, cols: [1, 2, 2, 1, 3, 3, 1, 2, 2, 1] },  
                { row: 3, cols: [1, 2, 2, 1, 3, 3, 1, 2, 2, 1] },
                { row: 4, cols: [1, 2, 2, 1, 3, 3, 1, 2, 2, 1]}, 
                { row: 5, cols: [1, 2, 2, 1, 3, 3, 1, 2, 2, 1] },  
                { row: 6, cols: [1, 2, 2, 1, 3, 3, 1, 2, 2, 1] },  
                { row: 7, cols: [1, 2, 2, 1, 3, 3, 1, 2, 2, 1] },
                { row: 8, cols: [4, 1, 1, 1, 1, 1, 1, 1, 1, 4]},
            ],
            availability: [
                { row: 0, cols: [false,false,false,false,false,false,false,false,false,false] },
                { row: 1, cols: [false, false, false, false, true, true, false, false, false, false] },
                { row: 2, cols: [false, true, false, false, true, false,false,true,false, false] },
                { row: 3, cols: [false, true, true, true, true, true, true, true, true, false] },
                { row: 4, cols: [false,false,false,false,false,false,false,false,false,false]},
                { row: 5, cols: [false, false, true, false, true, true, true, false, false, false] },
                { row: 6, cols: [false, false, false, false, false, false,false,false,false, false] },
                { row: 7, cols: [false, true, false, true, true, false, true, true, true, false] },
                { row: 8, cols: [false,false,false,false,false,false,false,false,false,false]}
            ],
            prices: [
                { row: 0, cols: [0, 0, 0, 0, 0,0, 0, 0, 0, 0] },
                { row: 1, cols: [0, 5, 5, 0,4, 4, 0,5,5, 0] },
                { row: 2, cols: [0, 5, 5, 0,4, 4, 0,5,5, 0] },
                { row: 3, cols: [0, 5, 5, 0,4, 4, 0,5,5, 0] },
                { row: 4, cols: [0, 5, 5, 0,4, 4, 0,5,5, 0] },
                { row: 5, cols: [0, 5, 5, 0,4, 4, 0,5,5, 0] },
                { row: 6, cols: [0, 5, 5, 0,4, 4, 0,5,5, 0] },
                { row: 7, cols: [0, 5, 5, 0,4, 4, 0,5,5, 0] },
                { row: 8, cols: [0, 0, 0, 0, 0,0, 0, 0, 0, 0] }
            ]
        },
    "2": {
            grid: [
                { row: 0, cols: [0, 1, 1, 1, 1, 1, 1, 1, 1, 0] },  
                { row: 1, cols: [1, 2, 2, 2, 2, 2, 2, 2, 2, 1] },    
                { row: 2, cols: [1, 2, 2, 3, 3, 3, 3, 3, 3, 1] },
                { row: 3, cols: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
                { row: 4, cols: [1, 2, 2, 2, 2, 2, 2, 2, 2, 1] }, 
                { row: 5, cols: [1, 3, 3, 3, 3, 3, 3, 3, 3, 1] }, 
                { row: 6, cols: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }, 
                { row: 7, cols: [1, 3, 3, 3, 3, 3, 3, 3, 3, 1]},  
                { row: 8, cols: [4, 1, 1, 1, 1, 1, 1, 1, 1, 4]},
            ],
            availability: [
                { row: 0, cols: [false,false,false,false,false,false,false,false,false,false] },
                { row: 1, cols: [false, false, false, false, true, true, false, false, false, false] },
                { row: 2, cols: [false, false, true, false, false, true,false,false,true, false] },
                { row: 3, cols: [false, true, true, true, true, true, true, true, true, false] },
                { row: 4, cols: [false,false,false,false,false,false,false,false,false,false]},
                { row: 5, cols: [false, false, false, false, true, true, false, false, false, false] },
                { row: 6, cols: [false, false, false, false, false, false,false,false,false, false] },
                { row: 7, cols: [false, true, true, true, true, true, true, true, true, false] },
                { row: 8, cols: [false,false,false,false,false,false,false,false,false,false]}
            ],
            prices: [
                { row: 0, cols: [0, 0, 0, 0, 0,0, 0, 0, 0, 0] },
                { row: 1, cols: [0, 5, 5, 5,5, 5, 5,5,5, 0] },
                { row: 2, cols: [0, 5, 5, 5,5, 5, 5,5,5, 0] },
                { row: 3, cols: [0, 0, 0, 0,0, 0, 0,0,0, 0] },
                { row: 4, cols: [0, 4, 4, 4, 4,4, 4, 4, 4, 0] },
                { row: 5, cols: [0, 4, 4, 4, 4,4, 4, 4, 4, 0] },
                { row: 6, cols: [0, 0, 0, 0,0, 0, 0,0,0, 0] },
                { row: 7, cols: [0, 5, 5, 5,5, 5, 5,5,5, 0] },
                { row: 8, cols: [0, 0, 0, 0, 0,0, 0, 0, 0, 0] }
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
export {db};