import axios from "axios";
const AxiosApiService = axios.create({
    baseURL: 'http://localhost:3000/agreements/',
    headers: {
        'Accept': 'application/json'
    }
});

AxiosApiService.interceptors.request.use(function (config) {
    // let token = localStorage.getItem('api_token');

    // config.headers.Authorization = 'Bearer ' + token;

    return config;
}, (err) => {
    return err
});

AxiosApiService.interceptors.response.use(res => res, error => { return Promise.reject(error) })

export default AxiosApiService;