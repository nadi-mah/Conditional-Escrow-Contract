import AxiosApiService from "./api/AxiosApiServer";

class AgreementService {

    async getAgreementsByPayer(data) {
        return await AxiosApiService.get(`payer/${data.payerAddress}`)
    }
    async getAgreementsByPayee(data) {
        return await AxiosApiService.get(`payee/${data.payeeAddress}`)
    }
    async getAgreementsByArbiter(data) {
        return await AxiosApiService.get(`arbiter/${data.arbiterAddress}`)
    }
    async getAgreementDetail(data) {
        return await AxiosApiService.get(`detail/${data.agreementId}`)
    }
    async updateRequestCompletionPayer(data) {
        return await AxiosApiService.put(`${data.agreementId}/request-completion-payer`)
    }
    async updateRequestCompletionPayee(data) {
        return await AxiosApiService.put(`${data.agreementId}/request-completion-payee`)
    }

    async updateRaiseDispute(data) {
        return await AxiosApiService.put(`${data.agreementId}/raise-dispute`)
    }
    async updateCancelExpiredAgreement(data) {
        return await AxiosApiService.put(`${data.agreementId}/cancel-expired`)
    }
    async updateExtendDuration(data) {
        return await AxiosApiService.put(`${data.agreementId}/extend-duration`, data)
    }
    async updateReleaseFunds(data) {
        return await AxiosApiService.put(`${data.agreementId}/release-funds`)
    }
    async updateResolveDispute(data) {
        return await AxiosApiService.put(`${data.agreementId}/resolve-dispute`, data)
    }
    async createAgreement(data) {
        return await AxiosApiService.post(`createAgreement`, data)
    }


}

export default new AgreementService;