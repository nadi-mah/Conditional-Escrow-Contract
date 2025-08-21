// React
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
    const [resolution, setResolution] = useState('');
    const [agreementDetail, setAgreementDetail] = useState({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);


    const handleResolveDispute = async (decision) => {
        const data = {
            agreementId: agreementId,
            winner: decision
        }
        await AgreementService.updateResolveDispute(data)
            .then(() => getAgreementDetail())
            .catch(err => console.error(err))

    }
    const handleResolve = (decision) => {
        console.log(`Resolving in favor of ${decision}:`, resolution);
        handleResolveDispute(decision);
    };
    const getAgreementDetail = async () => {
        const data = {
            agreementId: agreementId
        }
        await AgreementService.getAgreementDetail(data)
            .then(res => setAgreementDetail(res.data.agreement))
            .catch(err => console.error(err));

    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) handleDialogClose();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" onClick={getAgreementDetail}>
                    <Eye className="w-4 h-4" />
                    View Details
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Arbitration Case #{agreementDetail.id}</DialogTitle>
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Payer Address</Label>
                            <p className="text-sm font-mono mt-1 break-all">{agreementDetail.payer}</p>
                        </div>
                        <div>
                            <Label>Payee Address</Label>
                            <p className="text-sm font-mono mt-1 break-all">{agreementDetail.payee}</p>
                        </div>
                    </div>
                    <div>
                        <Label>Deadline</Label>
                        <p className="mt-1">{new Date(agreementDetail.deadline).toLocaleString()}</p>
                    </div>
                    {agreementDetail.disputeWinner &&
                        <div>
                            {/* <Label>Winner</Label> */}
                            <p className="mt-1 font-medium text-sm">{`Agreement has been resolved in the favour of ${agreementDetail.disputeWinner}.`}</p>
                        </div>
                    }


                    {agreementDetail.currentState === 'InDispute' && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex gap-2">
                                <Button
                                    variant="default"
                                    className="flex-1"
                                    onClick={() => handleResolve('payee')}
                                >
                                    Resolve in Favor of Payee
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleResolve('payer')}
                                >
                                    Resolve in Favor of Payer
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function ArbiterDashboard() {

    const [agreementsData, setAgreementsData] = useState([]);
    const [pendingDisputes, setPendingDisputes] = useState([]);
    const [resolvedCases, setResolvedCases] = useState([]);

    const arbiterAddress = import.meta.env.VITE_ARBITER_ADDRESS;

    const getAgreementsByArbiter = async () => {
        const data = {
            arbiterAddress: arbiterAddress
        }
        await AgreementService.getAgreementsByArbiter(data)
            .then(res => {
                setAgreementsData(res.data);
            })
            .catch(err => console.error(err));

    }

    useEffect(() => {
        getAgreementsByArbiter();
    }, []);
    useEffect(() => {
        if (agreementsData?.agreements?.length) {
            setPendingDisputes(agreementsData?.agreements.filter(a => a.currentState === 'InDispute'));
            setResolvedCases(agreementsData?.agreements.filter(a => a.currentState === 'Completed' && a.disputeWinner));
        }
    }, [agreementsData])


    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className='flex gap-2 items-end'>
                    Arbiter Dashboard
                    <span className="text-sm font-mono truncate pb-1.5">{arbiterAddress}</span>
                </h1>
                <p className="text-muted-foreground mt-1">Resolve disputes and manage arbitration cases</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Pending Disputes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-medium">{agreementsData.disputeCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Resolved Cases</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-medium">{agreementsData.resolveCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Cases</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-medium">{agreementsData.agreements?.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                {pendingDisputes.length > 0 && (
                    <div>
                        <h2 className="mb-4">Pending Disputes</h2>
                        <div className="grid gap-4">
                            {pendingDisputes.map((agreement) => (
                                <Card key={agreement.id} className="border-yellow-200 bg-yellow-50">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-base font-semibold">
                                                {agreement.title} #{agreement.id}
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
                                                <Label className="text-sm text-muted-foreground">Dispute Winner</Label>
                                                <p className="text-sm truncate">{agreement.disputeWinner || "no decision"}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <AgreementDetailsModal agreementId={agreement.id} handleDialogClose={getAgreementsByArbiter} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h2 className="mb-4">All Cases</h2>
                    <div className="grid gap-4">
                        {agreementsData?.agreements?.map((agreement) => (
                            <Card key={agreement.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base font-semibold">
                                            {agreement.title} #{agreement.id}
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
                                            <Label className="text-sm text-muted-foreground">Status</Label>
                                            <p className="text-sm">{agreement.currentState}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <AgreementDetailsModal agreementId={agreement.id} handleDialogClose={getAgreementsByArbiter} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}