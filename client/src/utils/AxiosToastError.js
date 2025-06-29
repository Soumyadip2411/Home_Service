import toast from "react-hot-toast"

const AxiosToastError = (error)=>{
    toast.error(
        error?.response?.data?.message
    )
}

export default AxiosToastError