const APP_CONFIG = {
    APP_ORIGIN: window.location.origin,
    API_BASE: "",
    FUNCTIONS_BASE: "/.netlify/functions",
    DASHBOARD_ROUTE: "/Dashboard",
    LOGIN_ROUTE: "/login.html",
    PRODUCT_ROUTE: "/produk.html",
    LYRICSHOT_ROUTE: "/lyricshot.html",
    WORKSPACE_ROUTE: "/workspace.html"
};

window.APP_CONFIG = APP_CONFIG;

async function callFunction(name, payload = {}) {
    const url = `${window.APP_CONFIG.FUNCTIONS_BASE}/${name}`;

    let response;
    try {
        response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        throw new Error("Backend Netlify Function tidak ditemukan. Pastikan domain ini terhubung ke Netlify site atau gunakan domain epikduniastudio.cloud.");
    }

    if (response.status === 404) {
        throw new Error("Backend Netlify Function tidak ditemukan. Pastikan domain ini terhubung ke Netlify site atau gunakan domain epikduniastudio.cloud.");
    }

    const text = await response.text();

    let data;
    try {
        data = JSON.parse(text);
    } catch (error) {
        throw new Error(`Function ${name} tidak mengembalikan JSON valid. Response: ${text.slice(0, 200)}`);
    }

    if (!response.ok || data.success === false) {
        throw new Error(data.error || `Function ${name} gagal`);
    }

    return data;
}

window.callFunction = callFunction;
