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
    return response.data;
}

const fetchNodes = async() => {
    const response = await axiosInstance.get(routes.quiz, { headers })
    return response.data.quiz
}

const saveJson = async(json) => {
    const response = await axiosInstance({
        method: 'POST',
        url: routes.quiz,
        data: json
    })
    return response.data
}

const api = {
    fetchLicenses,
    saveJson,
    fetchNodes,
}

export default api