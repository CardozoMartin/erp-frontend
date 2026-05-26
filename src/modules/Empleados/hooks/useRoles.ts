import { useQuery } from "@tanstack/react-query"
import { getRolesFn } from "../api/roles.api"


export const useRoles = ()=>{
    return useQuery({
        queryKey: ["roles"],
        queryFn: () => getRolesFn(),
        enabled: true,
    })
}