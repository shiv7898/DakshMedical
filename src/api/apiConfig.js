// export const BASE_URL = 'https://app.airsine.in';
export const BASE_URL = 'http://192.168.14.54:8000';

export const ENDPOINTS = {
    LOGIN: `${BASE_URL}/mobile/user/login`,
    REGISTER: `${BASE_URL}/mobile/user/register`,
    PROFILE: `${BASE_URL}/mobile/patient/profile`,
    PRODUCTS: `${BASE_URL}/mobile/products/`,
    BUY_MACHINE: `${BASE_URL}/mobile/orders/customer/buy-machine`,
    SUPPORT_QUERY: `${BASE_URL}/mobile/patient/support-query`,
    DISTRIBUTOR_PRODUCTS: `${BASE_URL}/mobile/distributor/my-products`,
    DISTRIBUTOR_BUY_MACHINE: `${BASE_URL}/mobile/distributor/buy-machine`,
    DISTRIBUTOR_ORDERS: `${BASE_URL}/mobile/distributor/orders`,
    DISTRIBUTOR_SUMMARY: `${BASE_URL}/mobile/distributor/summary`,
    DISTRIBUTOR_TRANSACTIONS: `${BASE_URL}/mobile/distributor/transactions`,
    DISTRIBUTOR_SUPPORT_QUERY: `${BASE_URL}/mobile/distributor/support-query`,
    DISTRIBUTOR_REPORTS: `${BASE_URL}/mobile/distributor/reports-data`,
    MY_ORDERS: `${BASE_URL}/mobile/orders/my-orders`,
    DOWNLOAD_SYNCED_PDF: `${BASE_URL}/mobile/patient/download-synced-pdf`,
    SYNC_PDF_DATA: `${BASE_URL}/mobile/patient/sync-pdf-data`,
    SYNCED_PDF_HISTORY: `${BASE_URL}/mobile/patient/synced-pdf-history`,

};
