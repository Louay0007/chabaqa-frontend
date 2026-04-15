import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'System Status | Chabaqa',
  description: 'Current operational status of all Chabaqa services.',
}

const SERVICES = [
  { name: 'API & Authentication', status: 'operational' },
  { name: 'Community Platform', status: 'operational' },
  { name: 'Courses & Challenges', status: 'operational' },
  { name: 'Video Streaming', status: 'operational' },
  { name: 'Payment Processing', status: 'operational' },
  { name: 'Email Delivery', status: 'operational' },
  { name: 'File Storage & Uploads', status: 'operational' },
  { name: 'Live Sessions', status: 'operational' },
]

function StatusIndicator({ status }: { status: string }) {
  if (status === 'operational') {
    return (
      <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 gap-1.5">
        <CheckCircle className="h-3.5 w-3.5" />
        Operational
      </Badge>
    )
  }
  if (status === 'degraded') {
    return (
      <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 gap-1.5">
        <AlertCircle className="h-3.5 w-3.5" />
        Degraded
      </Badge>
    )
  }
  return (
    <Badge variant="destructive" className="gap-1.5">
      <AlertCircle className="h-3.5 w-3.5" />
      Outage
    </Badge>
  )
}

export default function StatusPage() {
  const allOperational = SERVICES.every(s => s.status === 'operational')

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl mx-auto px-4 py-16 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold ${
            allOperational
              ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
              : 'bg-yellow-50 text-yellow-700'
          }`}>
            {allOperational ? (
              <><CheckCircle className="h-4 w-4" /> All systems operational</>
            ) : (
              <><AlertCircle className="h-4 w-4" /> Some systems affected</>
            )}
          </div>
          <h1 className="text-4xl font-bold">Chabaqa Status</h1>
          <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-sm">
            <Clock className="h-4 w-4" />
            Updated: {new Date().toLocaleString(undefined, {
              dateStyle: 'medium', timeStyle: 'short',
            })}
          </p>
        </div>

        {/* Service list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {SERVICES.map(service => (
                <div key={service.name} className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium">{service.name}</span>
                  <StatusIndicator status={service.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Incident history placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground py-2">
              No incidents reported in the last 90 days.
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          For urgent issues, contact{' '}
          <a href="mailto:support@chabaqa.com" className="underline underline-offset-2 hover:text-foreground">
            support@chabaqa.com
          </a>
        </p>
      </main>
      <Footer />
    </div>
  )
}
