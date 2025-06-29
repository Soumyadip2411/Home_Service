export const valideURLConvert = (name)=>{
    const url = name?.toString().replaceAll(" ","-").replaceAll(",","-").replaceAll("&","-")
    return url
}