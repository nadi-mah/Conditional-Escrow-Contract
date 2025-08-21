import { useEffect, useState } from "react";

// Components
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/Dialog';
import { Input } from '../components/Input';
import { Label } from '../components/Label';
import { Plus, Eye, Clock, CheckCircle, AlertTriangle, XCircle, UserCheck, LoaderCircle, LoaderPinwheel, CalendarCheck2, CircleArrowLeft } from 'lucide-react';

// API
import AgreementService from "../services/agreement";
import { createAgreement, confirmByPayer, readNextAgreementId, raiseDispute, extendDuration, getAgreement } from "../services/escrow";


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
        onChainId: null,
        title: "",
        payer: import.meta.env.VITE_PAYER_ADDRESS,
        payee: import.meta.env.VITE_PAYEE_ADDRESS,
        arbiter: import.meta.env.VITE_ARBITER_ADDRESS,
        amount: "",
        deadline: ""
    });

    const handlePostAgreementOnChain = async () => {
        // Send to blockchain
        const timeStamp = Math.floor(new Date(formData.deadline) / 1000);
        const payeeAddress = import.meta.env.VITE_PAYEE_ADDRESS;
        const arbiterAddress = import.meta.env.VITE_ARBITER_ADDRESS;
        const ethAmount = formData.amount;

        // Call createAgreement from escrow contract
        try {
            await createAgreement(payeeAddress, arbiterAddress, timeStamp, ethAmount);
            const onChainId = await readNextAgreementId();
            const form = { ...formData, ["onChainId"]: parseInt(onChainId) - 1 }
            handlePostAgreement(form);

        } catch (error) {
            // console.error(error);
        }
    }
    const handlePostAgreement = async (form) => {
        console.log(form);

        await AgreementService.createAgreement(form)
            .then((res) => {
                setFormData({
                    onChainId: null,
                    title: "",
                    payer: import.meta.env.VITE_PAYER_ADDRESS,
                    payee: import.meta.env.VITE_PAYEE_ADDRESS,
                    arbiter: import.meta.env.VITE_ARBITER_ADDRESS,
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
        handlePostAgreementOnChain();
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

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newDeadlineInput, setNewDeadlineInput] = useState(false);
    const [newDeadline, setNewDeadline] = useState(null);

    const [actions, setActions] = useState([]);


    const getAgreementDetail = async () => {
        const data = {
            agreementId: agreementId
        }
        await AgreementService.getAgreementDetail(data)
            .then(res => {
                setAgreementDetail(res.data.agreement);
            })
            .catch(err => console.error(err));

    }
    const handleConfirmByPayer = async () => {
        try {
            await confirmByPayer(agreementDetail.onChainId);

            // Post confirm to database
            const data = {
                agreementId: agreementId
            }
            await AgreementService.updateRequestCompletionPayer(data)
                .then(() => getAgreementDetail())
                .catch(err => console.error(err));
        } catch (error) { }

    }
    const handleRaiseDispute = async () => {
        try {
            await raiseDispute(agreementDetail.onChainId, "payer");

            // Post dispute on db
            const data = {
                agreementId: agreementId
            }
            await AgreementService.updateRaiseDispute(data)
                .then(() => getAgreementDetail())
                .catch(err => console.error(err));
        } catch (error) { }

    }
    const handleCancelExpiredAgreement = async () => {
        const data = {
            agreementId: agreementId
        }
        await AgreementService.updateCancelExpiredAgreement(data)
            .then(() => getAgreementDetail())
            .catch(err => console.error(err));
    }
    const handleExtendDuration = async () => {
        if (newDeadline) {
            // Extend on blockchain
            const newTimestamp = Math.floor(new Date(newDeadline) / 1000);
            try {
                await extendDuration(agreementDetail.onChainId, newTimestamp);

                // Post deadline to database
                const data = {
                    agreementId: agreementId,
                    deadline: new Date(newDeadline)
                }
                await AgreementService.updateExtendDuration(data)
                    .then(() => {
                        getAgreementDetail();
                        setNewDeadline(null);
                        setNewDeadlineInput(false);

                    })
                    .catch(err => console.error(err));

            } catch (error) { }
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
            agreementDetail.payeeConfirmed &&
            !agreementDetail.payerConfirmed
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

        // 3) Extend Duration
        if (
            agreementDetail.currentState === "Funded" &&
            !agreementDetail.payeeConfirmed
        ) {
            actions.push("extendDuration");
        }

        // 4) Cancel Expired Agreement
        if (
            isAfterDeadline &&
            !agreementDetail.payerConfirmed &&
            !agreementDetail.payeeConfirmed &&
            agreementDetail.currentState === "Funded"
        ) {
            actions.push("cancelExpired");
        }

        return actions;
    }
    const handleDetailModal = () => {
        getAgreementDetail();
    }
    useEffect(() => {
        setActions(getAvailableActions(agreementDetail));
    }, [agreementDetail])

    const getAgreementhandler = () => {
        console.log(getAgreement());
    }
    useEffect(() => {
        getAgreementhandler();
    }, [])



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
                    <div className="flex gap-2 pt-4 items-end">
                        {actions.includes("confirm") && (
                            <Button onClick={handleConfirmByPayer}>Confirm Completion</Button>
                        )}
                        {actions.includes("raiseDispute") && (
                            <Button variant="destructive" onClick={handleRaiseDispute}>
                                Raise Dispute
                            </Button>
                        )}
                        {actions.includes("extendDuration") ?
                            newDeadlineInput ?
                                <div className='flex flex-col gap-1.5'>
                                    <Label htmlFor="deadline">Deadline</Label>
                                    <div className="flex items-center gap-1.5">
                                        <Input
                                            id="deadline"
                                            type="datetime-local"
                                            value={newDeadline}
                                            onChange={(e) => setNewDeadline(e.target.value)}
                                            required
                                        />
                                        <div className="flex flex-col gap-1.5">
                                            <CircleArrowLeft className="w-3 h-3 cursor-pointer hover:stroke-orange-400" onClick={() => { setNewDeadlineInput(false) }} />
                                            <CalendarCheck2 className="w-3 h-3 cursor-pointer hover:stroke-blue-600" onClick={handleExtendDuration} />

                                        </div>
                                    </div>
                                </div>
                                : (
                                    <Button onClick={() => setNewDeadlineInput(true)}>Extend Duration</Button>
                                ) : ""}
                        {actions.includes("cancelExpired") && (
                            <Button variant="secondary" onClick={handleCancelExpiredAgreement}>
                                Cancel Expired Agreement
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function PayerDashboard() {

    const [agreements, setAgreements] = useState([]);
    const payerAddress = import.meta.env.VITE_PAYER_ADDRESS;

    const getAgreementsByPayer = async () => {
        const data = {
            payerAddress: payerAddress
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
                    <h1 className='flex gap-2 items-end'>
                        Payer Dashboard
                        <span className="text-sm font-mono truncate pb-1.5">{payerAddress}</span>
                    </h1>
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