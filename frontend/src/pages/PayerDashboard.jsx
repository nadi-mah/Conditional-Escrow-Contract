import { useState } from 'react';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/Dialog';
import { Input } from '../components/Input';
import { Label } from '../components/Label';
import { Plus, Eye, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

// Mock data for agreements
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

function CreateAgreementModal() {
    const [formData, setFormData] = useState({
        payeeAddress: '',
        arbiterAddress: '',
        amount: '',
        deadline: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Creating agreement:', formData);
        // Reset form
        setFormData({ payeeAddress: '', arbiterAddress: '', amount: '', deadline: '' });
    };

    return (
        <Dialog>
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
                    <div>
                        <Label htmlFor="payeeAddress">Payee Address</Label>
                        <Input
                            id="payeeAddress"
                            type="text"
                            placeholder="0x..."
                            value={formData.payeeAddress}
                            onChange={(e) => setFormData({ ...formData, payeeAddress: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="arbiterAddress">Arbiter Address</Label>
                        <Input
                            id="arbiterAddress"
                            type="text"
                            placeholder="0x..."
                            value={formData.arbiterAddress}
                            onChange={(e) => setFormData({ ...formData, arbiterAddress: e.target.value })}
                            required
                        />
                    </div>
                    <div>
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
                    <div>
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
                        <Label>Payee Address</Label>
                        <p className="text-sm font-mono mt-1 break-all">{agreement.payeeAddress}</p>
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
                                Confirm Completion
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

export function PayerDashboard() {
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1>Payer Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Manage your payment agreements</p>
                </div>
                <CreateAgreementModal />
            </div>

            <div className="grid gap-4">
                {mockAgreements.map((agreement) => (
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
                                    <Label className="text-sm text-muted-foreground">Payee</Label>
                                    <p className="text-sm font-mono truncate">{agreement.payeeAddress}</p>
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