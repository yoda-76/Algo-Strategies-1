import axios from "axios";

export const subscribeInstrument = async (key: string[]) => {
    const resp = await axios.post(`${process.env.ltpServiceUrl}/subscribe`, { instrumentKeys: key });
    return resp.data;
}