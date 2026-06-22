export const BASE_URL = 'http://10.158.33.26:8000';
// export const BASE_URL = 'http://localhost:8000';

export const ENDPOINTS = {
    LOGIN: `${BASE_URL}/login`,
    REGISTER: `${BASE_URL}/register`,
    PROFILE: `${BASE_URL}/patient/profile`,
    PRODUCTS: `${BASE_URL}/products/`,
    BUY_MACHINE: `${BASE_URL}/orders/customer/buy-machine`,
    SUPPORT_QUERY: `${BASE_URL}/patient/support-query`,
    DISTRIBUTOR_PRODUCTS: `${BASE_URL}/distributor/my-products`,
    DISTRIBUTOR_BUY_MACHINE: `${BASE_URL}/orders/distributor/buy-machine`,
    DISTRIBUTOR_ORDERS: `${BASE_URL}/distributor/orders`,
    DISTRIBUTOR_SUMMARY: `${BASE_URL}/distributor/summary`,
    DISTRIBUTOR_TRANSACTIONS: `${BASE_URL}/distributor/transactions`,
    DISTRIBUTOR_SUPPORT_QUERY: `${BASE_URL}/distributor/support-query`,
    DISTRIBUTOR_REPORTS: `${BASE_URL}/distributor/reports-data`,
    MY_ORDERS: `${BASE_URL}/orders/my-orders`,
    DOWNLOAD_SYNCED_PDF: `${BASE_URL}/patient/download-synced-pdf`,
    SYNC_PDF_DATA: `${BASE_URL}/patient/sync-pdf-data`,
    SYNCED_PDF_HISTORY: `${BASE_URL}/patient/synced-pdf-history`,

};
