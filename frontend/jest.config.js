export default{
    
    testEnvironment: "jsdom",
     transform: {
 
       '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
       
     },
     moduleNameMapper: {
        "\\.(svg|jpg|jpeg|png|gif|webp|ico)$": "<rootDir>/src/__mocks__/fileMock.js",
         "^firebase$": "<rootDir>/src/__mocks__/firebase.js"
      },
     setupFilesAfterEnv: ['@testing-library/jest-dom',"<rootDir>/setupTests.js"],
     
   };