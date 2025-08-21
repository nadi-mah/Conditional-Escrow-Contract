import { useState, useEffect } from 'react';

// Components 
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/Dialog';
import { Label } from '../components/Label';
import { Eye, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

// API
import AgreementService from "../services/agreement";
import { confirmByPayee, releaseFunds } from "../services/escrow";



// Mock data for payee agreements (received agreements)
const mockPayeeAgreements = [
    {
        id: '1',
        payerAddress: '0x456d35Cc6329C1532D4b2f90aFca57DF22B1bD4C',
        arbiterAddress: '0x8ba1f109551bD432803012645Hac136c6d03b442',
        amount: '2.5',
        deadline: '2025-08-15T14:30:00',
        status: 'Funded',
        confirmed: false
    },
    {
        id: '4',
        payerAddress: '0x789d35Cc6329C1532D4b2f90aFca57DF22B1bD4C',
        arbiterAddress: '0x456a1f109551bD432803012645Hac136c6d03b442',
        amount: '0.8',
        deadline: '2025-08-25T12:00:00',
        status: 'Completed',
        confirmed: true
    },
    {
        id: '5',
        payerAddress: '0x321d35Cc6329C1532D4b2f90aFca57DF22B1bD4C',
        arbiterAddress: '0x101f109551bD432803012645Hac136c6d03b442',
        amount: '1.2',
        deadline: '2025-08-18T09:30:00',
        status: 'InDispute',
        confirmed: false
    }
];

function getStatusIcon(status) {
    switch (status) {
        case 'Funded': return <Clock className="w-4 h-4" />;
        case 'Completed': return <CheckCircle className="w-4 h-4" />;
        case 'InDispute': return <AlertTriangle className="w-4 h-4" />;
        case 'Canceled': return <XCircle className="w-4 h-4" />;
        default: return <Clock className="w-4 h-4" />;
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'Funded': return 'bg-blue-100 text-blue-800';
        case 'Completed': return 'bg-green-100 text-green-800';
        case 'InDispute': return 'bg-yellow-100 text-yellow-800';
        case 'Canceled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function AgreementDetailsModal({ agreementId, handleDialogClose }) {

    const [agreementDetail, setAgreementDetail] = useState({});

    const [actions, setActions] = useState([]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const getAgreementDetail = async () => {
        const data = {
            agreementId: agreementId
        }
        await AgreementService.getAgreementDetail(data)
            .then(res => setAgreementDetail(res.data.agreement))
            .catch(err => console.error(err));

    }
    const handleConfirmByPayee = async () => {
        try {
            await confirmByPayee(agreementDetail.onChainId);

            // Post confirm to database
            const data = {
                agreementId: agreementId
            }
            await AgreementService.updateRequestCompletionPayee(data)
                .then(() => getAgreementDetail())
                .catch(err => console.error(err));

        } catch (error) { }

    }
    const handleRaiseDispute = async () => {
        const data = {
            agreementId: agreementId
        }
        await AgreementService.updateRaiseDispute(data)
            .then(() => getAgreementDetail())
            .catch(err => console.error(err));
    }
    const handleReleaseFunds = async () => {
        try {
            await releaseFunds(agreementDetail.onChainId);

            // Db post data
            const data = {
                agreementId: agreementId
            }
            await AgreementService.updateReleaseFunds(data)
                .then(() => getAgreementDetail())
                .catch(err => console.error(err));
        } catch (error) {

        }

    }
    const getAvailableActions = () => {
        const actions = []
        const now = new Date().toLocaleString()
        const deadline = new Date(agreementDetail.deadline).toLocaleString();
        const isBeforeDeadline = now < deadline;
        const isAfterDeadline = now > deadline;

        // 1) Confirm Completion
        if (
            agreementDetail.currentState === "Funded" &&
            isBeforeDeadline &&
            !agreementDetail.payeeConfirmed
        ) {
            actions.push("confirm");
        }
        // 2) Raise Dispute
        if (
            isAfterDeadline &&
            !(agreementDetail.payerConfirmed && agreementDetail.payeeConfirmed) &&
            !(!agreementDetail.payerConfirmed && !agreementDetail.payeeConfirmed) &&
            agreementDetail.currentState === "Funded"
        ) {
            actions.push("raiseDispute");
        }
        // 3) Release Funds
        if (
            agreementDetail.payeeConfirmed &&
            agreementDetail.payerConfirmed &&
            agreementDetail.currentState === "Funded"
        ) {
            actions.push("releaseFunds");
        }

        return actions;
    }
    const handleDetailModal = () => {
        getAgreementDetail();
    }
    useEffect(() => {
        setActions(getAvailableActions(agreementDetail));
    }, [agreementDetail])

    return (
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) handleDialogClose();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDetailModal()}>
                    <Eye className="w-4 h-4" />
                    View Details
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Agreement Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Status</Label>
                            <div className="flex items-center gap-2 mt-1">
                                {getStatusIcon(agreementDetail.currentState)}
                                <Badge className={getStatusColor(agreementDetail.currentState)}>
                                    {agreementDetail.currentState}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <Label>Amount</Label>
                            <p className="mt-1">{agreementDetail.amount} ETH</p>
                        </div>
                    </div>

                    <div>
                        <Label>Payer Address</Label>
                        <p className="text-sm font-mono mt-1 break-all">{agreementDetail.payer}</p>
                    </div>

                    <div>
                        <Label>Arbiter Address</Label>
                        <p className="text-sm font-mono mt-1 break-all">{agreementDetail.arbiter}</p>
                    </div>

                    <div>
                        <Label>Deadline</Label>
                        <p className="mt-1">{new Date(agreementDetail.deadline).toLocaleString()}</p>
                    </div>

                    {(agreementDetail.currentState === "Funded" || agreementDetail.currentState === "InDispute") &&
                        <div>
                            <Label>Confirmation Status</Label>
                            <p className="mt-1">
                                {!agreementDetail.payeeConfirmed ? 'Payee Pending Confirmation' :
                                    agreementDetail.currentState === "InDispute" ? "Dispute has raised" :
                                        !agreementDetail.payerConfirmed ? 'Payer Pending Confirmation' :
                                            agreementDetail.currentState === "Funded" ? "Release Funds Pending" :
                                                'Confirmed'}
                            </p>
                        </div>}
                    {actions.includes("confirm") && (
                        <Button variant="default" className="flex-1" onClick={handleConfirmByPayee}>
                            Confirm Delivery
                        </Button>)}
                    {actions.includes("raiseDispute") && (
                        <Button variant="destructive" className="flex-1" onClick={handleRaiseDispute}>
                            Raise Dispute
                        </Button>
                    )}
                    {actions.includes("releaseFunds") && (
                        <Button variant="secondary" className="flex-1" onClick={handleReleaseFunds}>
                            Release Funds
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function PayeeDashboard() {

    const [agreements, setAgreements] = useState([]);
    const payeeAddress = import.meta.env.VITE_PAYEE_ADDRESS;

    const getAgreementsByPayee = async () => {
        const data = {
            payeeAddress: payeeAddress
        }
        await AgreementService.getAgreementsByPayee(data)
            .then(res => setAgreements(res.data.agreements))
            .catch(err => console.error(err));

    }

    useEffect(() => {
        getAgreementsByPayee();
    }, []);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className='flex gap-2 items-end'>
                        Payee Dashboard
                        <span className="text-sm font-mono truncate pb-1.5">{payeeAddress}</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">Track agreements where you're the recipient</p>
                </div>
            </div>

            <div className="grid gap-4">
                {agreements.map((agreement) => (
                    <Card key={agreement.id}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base font-semibold">
                                    {`#${agreement.id} ${agreement.title}` || `Agreement #${agreement.id}`}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(agreement.currentState)}
                                    <Badge className={getStatusColor(agreement.currentState)}>
                                        {agreement.currentState}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <Label className="text-sm text-muted-foreground">Amount</Label>
                                    <p>{agreement.amount} ETH</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-muted-foreground">Deadline</Label>
                                    <p>{new Date(agreement.deadline).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-muted-foreground">Payer</Label>
                                    <p className="text-sm font-mono truncate">{agreement.payer}</p>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <AgreementDetailsModal agreementId={agreement.id} handleDialogClose={getAgreementsByPayee} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}