// export const BASE_URL = 'https://app.airsine.in';
export const BASE_URL = 'http://192.168.14.98:8000';

export const ENDPOINTS = {
    LOGIN: `${BASE_URL}/api/v1/mobile/user/login`,
    REGISTER: `${BASE_URL}/api/v1/mobile/user/register`,
    PROFILE: `${BASE_URL}/api/v1/mobile/patient/profile`,
    PRODUCTS: `${BASE_URL}/api/v1/mobile/products/`,
    BUY_MACHINE: `${BASE_URL}/api/v1/mobile/orders/customer/buy-machine`,
    SUPPORT_QUERY: `${BASE_URL}/api/v1/mobile/patient/support-query`,
    DISTRIBUTOR_PRODUCTS: `${BASE_URL}/api/v1/mobile/distributor/my-products`,
    DISTRIBUTOR_BUY_MACHINE: `${BASE_URL}/api/v1/mobile/distributor/buy-machine`,
    DISTRIBUTOR_ORDERS: `${BASE_URL}/api/v1/mobile/distributor/orders`,
    DISTRIBUTOR_SUMMARY: `${BASE_URL}/api/v1/mobile/distributor/summary`,
    DISTRIBUTOR_TRANSACTIONS: `${BASE_URL}/api/v1/mobile/distributor/transactions`,
    DISTRIBUTOR_SUPPORT_QUERY: `${BASE_URL}/api/v1/mobile/distributor/support-query`,
    DISTRIBUTOR_REPORTS: `${BASE_URL}/api/v1/mobile/distributor/reports-data`,
    MY_ORDERS: `${BASE_URL}/api/v1/mobile/orders/my-orders`,
    DOWNLOAD_SYNCED_PDF: `${BASE_URL}/api/v1/mobile/patient/download-synced-pdf`,
    SYNC_PDF_DATA: `${BASE_URL}/api/v1/mobile/patient/sync-pdf-data`,
    SYNCED_PDF_HISTORY: `${BASE_URL}/api/v1/mobile/patient/synced-pdf-history`,
    VERIFY_REFERRAL: `${BASE_URL}/api/v1/mobile/orders/verify-referral/`,
};

