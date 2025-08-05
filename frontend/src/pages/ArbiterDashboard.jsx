import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Eye, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useState } from 'react';

// Mock data for arbiter agreements (where user is arbiter)
const mockArbiterAgreements = [
    {
        id: '3',
        payerAddress: '0x789d35Cc6329C1532D4b2f90aFca57DF22B1bD4C',
        payeeAddress: '0x742d35Cc6329C1532D4b2f90aFca57DF22B1bD4C',
        amount: '0.75',
        deadline: '2025-08-12T16:45:00',
        status: 'InDispute',
        confirmed: false,
        disputeReason: 'Service not delivered as agreed'
    },
    {
        id: '6',
        payerAddress: '0x321d35Cc6329C1532D4b2f90aFca57DF22B1bD4C',
        payeeAddress: '0x456d35Cc6329C1532D4b2f90aFca57DF22B1bD4C',
        amount: '1.2',
        deadline: '2025-08-18T09:30:00',
        status: 'InDispute',
        confirmed: false,
        disputeReason: 'Quality issues with delivered work'
    },
    {
        id: '7',
        payerAddress: '0x123d35Cc6329C1532D4b2f90aFca57DF22B1bD4C',
        payeeAddress: '0x456d35Cc6329C1532D4b2f90aFca57DF22B1bD4C',
        amount: '2.0',
        deadline: '2025-08-10T11:00:00',
        status: 'Completed',
        confirmed: true,
        disputeReason: null
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

function AgreementDetailsModal({ agreement }) {
    const [resolution, setResolution] = useState('');

    const handleResolve = (decision) => {
        console.log(`Resolving in favor of ${decision}:`, resolution);
        setResolution('');
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="w-4 h-4" />
                    View Details
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Arbitration Case #{agreement.id}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Status</Label>
                            <div className="flex items-center gap-2 mt-1">
                                {getStatusIcon(agreement.status)}
                                <Badge className={getStatusColor(agreement.status)}>
                                    {agreement.status}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <Label>Amount</Label>
                            <p className="mt-1">{agreement.amount} ETH</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Payer Address</Label>
                            <p className="text-sm font-mono mt-1 break-all">{agreement.payerAddress}</p>
                        </div>
                        <div>
                            <Label>Payee Address</Label>
                            <p className="text-sm font-mono mt-1 break-all">{agreement.payeeAddress}</p>
                        </div>
                    </div>

                    <div>
                        <Label>Deadline</Label>
                        <p className="mt-1">{new Date(agreement.deadline).toLocaleString()}</p>
                    </div>

                    {agreement.disputeReason && (
                        <div>
                            <Label>Dispute Reason</Label>
                            <p className="mt-1 p-3 bg-muted rounded-md">{agreement.disputeReason}</p>
                        </div>
                    )}

                    {agreement.status === 'InDispute' && (
                        <div className="space-y-4 pt-4 border-t">
                            <div>
                                <Label htmlFor="resolution">Resolution Notes</Label>
                                <Textarea
                                    id="resolution"
                                    placeholder="Enter your resolution decision and reasoning..."
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
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
    const pendingDisputes = mockArbiterAgreements.filter(a => a.status === 'InDispute');
    const resolvedCases = mockArbiterAgreements.filter(a => a.status === 'Completed');

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1>Arbiter Dashboard</h1>
                <p className="text-muted-foreground mt-1">Resolve disputes and manage arbitration cases</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Pending Disputes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-medium">{pendingDisputes.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Resolved Cases</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-medium">{resolvedCases.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Cases</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-medium">{mockArbiterAgreements.length}</div>
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
                                            <CardTitle className="text-base">
                                                Case #{agreement.id}
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(agreement.status)}
                                                <Badge className={getStatusColor(agreement.status)}>
                                                    {agreement.status}
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
                                                <Label className="text-sm text-muted-foreground">Dispute</Label>
                                                <p className="text-sm truncate">{agreement.disputeReason}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <AgreementDetailsModal agreement={agreement} />
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
                        {mockArbiterAgreements.map((agreement) => (
                            <Card key={agreement.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">
                                            Case #{agreement.id}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(agreement.status)}
                                            <Badge className={getStatusColor(agreement.status)}>
                                                {agreement.status}
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
                                            <p className="text-sm">{agreement.status}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <AgreementDetailsModal agreement={agreement} />
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