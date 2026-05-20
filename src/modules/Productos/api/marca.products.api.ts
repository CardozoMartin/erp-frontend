import { api } from "../../../api/ApiBase";

//funcion para obtener los productos de una marca
export const getMarcaProductAllFn = async (page: number, limit: number) => {
    const res = await api.get('marca-productos', {
        params: {
            page,
            limit
        }
    });
    return res.data;
}