import Axios from "./Axios"
import SummaryApi from "../common/SummaryApi"

const fetchUserDetails = async () => {
  try {
    const response = await Axios({
      ...SummaryApi.userDetails,
    });

    if (response.data.success) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
};

export default fetchUserDetails