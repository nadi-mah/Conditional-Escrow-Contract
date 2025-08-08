import { useState } from 'react';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/Dialog';
import { Label } from '../components/Label';
import { Eye, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

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

function AgreementDetailsModal({ agreement }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
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

                    <div>
                        <Label>Payer Address</Label>
                        <p className="text-sm font-mono mt-1 break-all">{agreement.payerAddress}</p>
                    </div>

                    <div>
                        <Label>Arbiter Address</Label>
                        <p className="text-sm font-mono mt-1 break-all">{agreement.arbiterAddress}</p>
                    </div>

                    <div>
                        <Label>Deadline</Label>
                        <p className="mt-1">{new Date(agreement.deadline).toLocaleString()}</p>
                    </div>

                    <div>
                        <Label>Confirmation Status</Label>
                        <p className="mt-1">{agreement.confirmed ? 'Confirmed' : 'Pending Confirmation'}</p>
                    </div>

                    {agreement.status === 'Funded' && (
                        <div className="flex gap-2 pt-4">
                            <Button variant="default" className="flex-1">
                                Confirm Delivery
                            </Button>
                            <Button variant="destructive" className="flex-1">
                                Raise Dispute
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function PayeeDashboard() {
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1>Payee Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Track agreements where you're the recipient</p>
                </div>
            </div>

            <div className="grid gap-4">
                {mockPayeeAgreements.map((agreement) => (
                    <Card key={agreement.id}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base">
                                    Agreement #{agreement.id}
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
                                    <Label className="text-sm text-muted-foreground">Payer</Label>
                                    <p className="text-sm font-mono truncate">{agreement.payerAddress}</p>
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
    );
}