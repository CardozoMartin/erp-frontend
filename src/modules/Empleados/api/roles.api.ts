import { api } from "../../../api/ApiBase"


export const getRolesFn = async () => {
    const res = await api.get("/roles");
    return res.data;
}