import { useEffect, useState } from "react";

// Components
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/Dialog';
import { Input } from '../components/Input';
import { Label } from '../components/Label';
import { Plus, Eye, Clock, CheckCircle, AlertTriangle, XCircle, UserCheck, LoaderCircle, LoaderPinwheel } from 'lucide-react';

// API
import AgreementService from "../services/agreement";




const mockAgreements = [
    {
        id: '1',
        payeeAddress: '0x742d35Cc6329C1532D4b2f90aFca57DF22B1bD4C',
        arbiterAddress: '0x8ba1f109551bD432803012645Hac136c6d03b442',
        amount: '2.5',
        deadline: '2025-08-15T14:30:00',
        status: 'Funded',
        confirmed: false
    },
    {
        id: '2',
        payeeAddress: '0x123d35Cc6329C1532D4b2f90aFca57DF22B1bD4C',
        arbiterAddress: '0x456a1f109551bD432803012645Hac136c6d03b442',
        amount: '1.0',
        deadline: '2025-08-20T10:00:00',
        status: 'Completed',
        confirmed: true
    },
    {
        id: '3',
        payeeAddress: '0x789d35Cc6329C1532D4b2f90aFca57DF22B1bD4C',
        arbiterAddress: '0x101f109551bD432803012645Hac136c6d03b442',
        amount: '0.75',
        deadline: '2025-08-12T16:45:00',
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

function CreateAgreementModal({ handleDialogClose }) {

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        onChainId: "10025",
        title: "",
        payer: "0x123",
        payee: "",
        arbiter: "",
        amount: "",
        deadline: ""
    });
    const handlePostAgreement = async () => {
        console.log(formData);
        await AgreementService.createAgreement(formData)
            .then((res) => {
                console.log(res);
                setFormData({
                    onChainId: "10028",
                    title: "",
                    payer: "0x123",
                    payee: "",
                    arbiter: "",
                    amount: "",
                    deadline: ""
                });
                setIsDialogOpen(false);
                handleDialogClose();
            })
            .catch((error) => console.error(error))
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData);
        handlePostAgreement();

    };



    return (
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) handleDialogClose();
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Agreement
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Agreement</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className='flex flex-col gap-1.5'>
                        <Label htmlFor="title">Agreement Title</Label>
                        <Input
                            id="title"
                            type="text"
                            placeholder="title..."
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className='flex flex-col gap-1.5'>
                        <Label htmlFor="payeeAddress">Payee Address</Label>
                        <Input
                            id="payee"
                            type="text"
                            placeholder="0x..."
                            value={formData.payee}
                            onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                            required
                        />
                    </div>
                    <div className='flex flex-col gap-1.5'>
                        <Label htmlFor="arbiterAddress">Arbiter Address</Label>
                        <Input
                            id="arbiter"
                            type="text"
                            placeholder="0x..."
                            value={formData.arbiter}
                            onChange={(e) => setFormData({ ...formData, arbiter: e.target.value })}
                            required
                        />
                    </div>
                    <div className='flex flex-col gap-1.5'>
                        <Label htmlFor="amount">Amount (ETH)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />
                    </div>
                    <div className='flex flex-col gap-1.5'>
                        <Label htmlFor="deadline">Deadline</Label>
                        <Input
                            id="deadline"
                            type="datetime-local"
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full">
                        Submit Agreement
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AgreementDetailsModal({ agreementId, handleDialogClose }) {

    const [agreementDetail, setAgreementDetail] = useState({});
    const [isDisputeAllowed, setIsDisputeAllowed] = useState(false);
    const [isCancelAllowed, setIsCancelAllowed] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const getAgreementDetail = async () => {
        const data = {
            agreementId: agreementId
        }
        await AgreementService.getAgreementDetail(data)
            .then(res => setAgreementDetail(res.data.agreement))
            .catch(err => console.error(err));

    }
    const handleConfirmByPayer = async () => {
        const data = {
            agreementId: agreementId
        }
        await AgreementService.updateRequestCompletionPayer(data)
            .then(() => getAgreementDetail())
            .catch(err => console.error(err));
    }
    const handleRaiseDispute = async () => {
        const data = {
            agreementId: agreementId
        }
        await AgreementService.updateRaiseDispute(data)
            .then(() => getAgreementDetail())
            .catch(err => console.error(err));
    }
    const handleCancelExpiredAgreement = async () => {
        const data = {
            agreementId: agreementId
        }
        await AgreementService.updateCancelExpiredAgreement(data)
            .then(() => getAgreementDetail())
            .catch(err => console.error(err));
    }
    const handleDetailModal = () => {
        getAgreementDetail();
    }
    const handleIsDisputeAllowed = () => {
        if (new Date().toLocaleString() < new Date(agreementDetail.deadline).toLocaleString()) {
            setIsDisputeAllowed(false);
        } else if (!agreementDetail.payerConfirmed && !agreementDetail.payeeConfirmed) {
            setIsDisputeAllowed(false);
        } else if (agreementDetail.payerConfirmed && agreementDetail.payeeConfirmed) {
            setIsDisputeAllowed(false);
        } else {
            setIsDisputeAllowed(true);
        }
    }
    const handleIdCancelAllowed = () => {
        if (new Date().toLocaleString() < new Date(agreementDetail.deadline).toLocaleString()) {
            setIsCancelAllowed(false);
        } else if (agreementDetail.payerConfirmed || agreementDetail.payeeConfirmed) {
            setIsCancelAllowed(false);
        } else if (agreementDetail.currentState != "Funded") {
            setIsCancelAllowed(false);
        } else {
            setIsCancelAllowed(true);
        }
    }
    useEffect(() => {
        handleIsDisputeAllowed();
        handleIdCancelAllowed();
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
                    <div className="flex gap-5 justify-between">
                        <div>
                            <Label>Title</Label>
                            <p className="mt-1">{agreementDetail.title}</p>
                        </div>
                        <div>
                            <Label>Amount</Label>
                            <p className="mt-1">{agreementDetail.amount} ETH</p>
                        </div>
                        <div>
                            <Label>Status</Label>
                            <div className="flex items-center gap-2 mt-1">
                                {getStatusIcon(agreementDetail.currentState)}
                                <Badge className={getStatusColor(agreementDetail.currentState)}>
                                    {agreementDetail.currentState}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label>Payee Address</Label>
                        <p className="text-sm font-mono mt-1 break-all">{agreementDetail.payee}</p>
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
                                {!agreementDetail.payeeConfirmed ?
                                    <div className="flex items-center gap-2 mt-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        Payee Pending Confirmation
                                    </div>
                                    : agreementDetail.payerConfirmed ?
                                        <div className="flex items-center gap-2 mt-1">
                                            <UserCheck className="w-4 h-4" />
                                            Payer Confirmed
                                        </div>
                                        :
                                        <div className="flex items-center gap-2 mt-1">
                                            <AlertTriangle className="w-4 h-4" />
                                            {agreementDetail.currentState === "InDispute" ?
                                                "Dispute has raised" : "Payer Pending Confirmation"}
                                        </div>}
                            </p>
                        </div>
                    }

                    {agreementDetail.currentState === 'Funded' && (
                        <div className="flex gap-2 pt-4">
                            {!agreementDetail.payerConfirmed && agreementDetail.payeeConfirmed &&
                                <Button variant="default" className="flex-1" onClick={() => handleConfirmByPayer()}>
                                    Confirm Completion
                                </Button>
                            }
                            <Button variant={isDisputeAllowed ? "destructive" : "disabled"} className="flex-1" onClick={() => handleRaiseDispute()}>
                                Raise Dispute
                            </Button>
                        </div>
                    )}

                    {isCancelAllowed &&
                        <div className="flex gap-2">
                            <Button variant="default" className="flex-1" onClick={() => handleCancelExpiredAgreement()}>
                                Cancel
                            </Button>
                        </div>
                    }

                </div>
                {!isDisputeAllowed && agreementDetail.currentState === 'Funded' &&
                    <p className="text-sm mt-1 break-all text-muted-foreground">
                        A dispute can only be raised after the agreement deadline has passed. it cannot be raised if both have confirmed, or neither has.
                    </p>}
            </DialogContent>
        </Dialog>
    );
}

export function PayerDashboard() {

    const [agreements, setAgreements] = useState([]);

    const getAgreementsByPayer = async () => {
        const data = {
            payerAddress: "0x123"
        }
        await AgreementService.getAgreementsByPayer(data)
            .then(res => setAgreements(res.data.agreements))
            .catch(err => console.error(err));

    }
    useEffect(() => {
        getAgreementsByPayer();
    }, []);



    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1>Payer Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Manage your payment agreements</p>
                </div>
                <CreateAgreementModal handleDialogClose={getAgreementsByPayer} />
            </div>

            <div className="grid gap-4">
                {agreements.map((agreement) => (
                    <Card key={agreement.id}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base font-semibold">
                                    {agreement.title || `Agreement #${agreement.id}`}
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
                                    <Label className="text-sm text-muted-foreground">Payee</Label>
                                    <p className="text-sm font-mono truncate">{agreement.payee}</p>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <AgreementDetailsModal agreementId={agreement.id} handleDialogClose={getAgreementsByPayer} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}