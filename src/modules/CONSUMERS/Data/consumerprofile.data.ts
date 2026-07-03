export const consumerProfileData = {
    consumerNumber:
        process.env.CONSUMER_NUMBER?.trim() || "N3477021215",
    query: {
        billingLimit: 12,
        eventPage: 1,
        eventPageSize: 20,
    },
};
