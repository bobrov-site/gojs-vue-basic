import routes from "./routes"
import axios from "axios";

const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin': '*'
}

const axiosInstance = axios.create({
    baseURL: routes.baseUrl
})

const fetchLicenses = async() => {
    const response = await axiosInstance.get(routes.licensesDictionary, { headers })
    return response;
}

const api = {
    fetchLicenses,
    headers
}

export default api