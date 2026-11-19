import axios from "axios";

// ==========================================
// 1. CAU HINH API CONG KHAI
// ==========================================

const publicClient = axios.create({

    baseURL:
        import.meta.env.VITE_API_URL ||
        "http://localhost:3000/api",

    timeout: 60000,

    headers: {
        Accept: "application/json"
    }

});

// ==========================================
// 2. XU LY PHAN HOI
// ==========================================

publicClient.interceptors.response.use(

    (response) => response.data,

    (error) => Promise.reject(error)

);

// ==========================================
// 3. API XAC THUC TAI LIEU
// ==========================================

const verificationApi = {

    // Tra cuu bang ma tai lieu

    lookup(documentCode) {

        const code = documentCode.trim();

        return publicClient.get(
            `/verification/lookup/${encodeURIComponent(code)}`
        );
    },

    // Xac thuc bang file

    verify(documentCode, file) {

        const formData = new FormData();

        formData.append(
            "documentCode",
            documentCode.trim()
        );

        formData.append("file", file);

        return publicClient.post(
            "/verification/verify",
            formData
        );
    }
};

export default verificationApi;