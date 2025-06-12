"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appleOAuth = exports.googleOAuth = exports.tokenCache = void 0;
const Linking = __importStar(require("expo-linking"));
const SecureStore = __importStar(require("expo-secure-store"));
const fetch_1 = require("./fetch");
exports.tokenCache = {
    async getToken(key) {
        try {
            const item = await SecureStore.getItemAsync(key);
            return item;
        }
        catch (error) {
            console.error("SecureStore get item error: ", error);
            await SecureStore.deleteItemAsync(key);
            return null;
        }
    },
    async saveToken(key, value) {
        try {
            return SecureStore.setItemAsync(key, value);
        }
        catch (err) {
            console.error("SecureStore save item error: ", err);
        }
    },
};
const googleOAuth = async (startOAuthFlow) => {
    var _a;
    try {
        const { createdSessionId, signUp, setActive } = await startOAuthFlow({
            redirectUrl: Linking.createURL("/root/tabs/home"),
        });
        if (createdSessionId) {
            if (setActive) {
                await setActive({ session: createdSessionId });
                if (signUp.createdUserId) {
                    await (0, fetch_1.fetchAPI)("/api/user/newUser", {
                        method: "POST",
                        body: JSON.stringify({
                            email: signUp.emailAddress,
                            clerkId: signUp.createdUserId
                        }),
                    });
                }
                return {
                    success: true,
                    code: "success",
                    message: "You have successfully authenticated",
                };
            }
        }
        return {
            success: false,
            message: "An error occurred",
        };
    }
    catch (error) {
        return {
            success: false,
            code: error.code,
            message: (_a = error === null || error === void 0 ? void 0 : error.errors[0]) === null || _a === void 0 ? void 0 : _a.longMessage,
        };
    }
};
exports.googleOAuth = googleOAuth;
const appleOAuth = async (signUpResult, appleId) => {
    var _a, _b;
    try {
        const { createdSessionId, createdUserId, emailAddress } = signUpResult;
        console.log("came here 4", createdSessionId, createdUserId, emailAddress);
        if (createdSessionId) {
            // Set the session as active
            await signUpResult.setActive({ session: createdSessionId });
            console.log("Came here 5", createdSessionId);
            if (createdUserId) {
                // Create new user in the database after successful sign-up
                console.log("Came here 6", createdUserId);
                const user = await (0, fetch_1.fetchAPI)("/api/user/newUser", {
                    method: "POST",
                    body: JSON.stringify({
                        email: emailAddress || "", // The email received from the Apple OAuth
                        clerkId: createdUserId, // Clerk ID after user creation
                        appleId: appleId
                    }),
                });
                console.log("User created in database:", user);
            }
            return {
                success: true,
                code: "success",
                message: "You have successfully authenticated with Apple",
            };
        }
        return {
            success: false,
            message: "An error occurred during the Apple OAuth process.",
        };
    }
    catch (error) {
        console.error("Apple OAuth Error:", error);
        return {
            success: false,
            code: error.code || "unknown_error",
            message: ((_b = (_a = error === null || error === void 0 ? void 0 : error.errors) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.longMessage) || "An unknown error occurred.",
        };
    }
};
exports.appleOAuth = appleOAuth;
