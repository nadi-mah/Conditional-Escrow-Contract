import AxiosApiService from "./api/AxiosApiServer";

class AgreementService {

    async getAgreementsByPayer(data) {
        return await AxiosApiService.get(`payer/${data.payerAddress}`)
    }

    async getAgreementDetail(data) {
        return await AxiosApiService.get(`detail/${data.agreementId}`)
    }
    async updateRequestCompletionPayer(data) {
        return await AxiosApiService.put(`${data.agreementId}/request-completion-payer`)
    }
    async updateRaiseDispute(data) {
        return await AxiosApiService.put(`${data.agreementId}/raise-dispute`)
    }
    async updateCancelExpiredAgreement(data) {
        return await AxiosApiService.put(`${data.agreementId}/cancel-expired`)
    }
    async createAgreement(data) {
        return await AxiosApiService.post(`createAgreement`, data)
    }


}

export default new AgreementService;