import { useState } from 'react'
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: 'How do I reset my password?',
    answer: 'Go to Settings > Security > Change Password. Enter your current password and your new password twice to confirm. If you forgot your password, contact your system administrator to reset it.',
  },
  {
    question: 'How do I add a new user to the system?',
    answer: 'Navigate to Users page and click "Add User" button. Fill in the required information including email, name, and role. The new user will receive an email invitation to set up their account.',
  },
  {
    question: 'What do the different device statuses mean?',
    answer: 'Online: Device is currently connected and active. Offline: Device has not communicated with the server in the last 5 minutes. Disabled: Device has been manually disabled by an administrator.',
  },
  {
    question: 'How do I export audit logs?',
    answer: 'Go to the Audit Logs page, apply any filters you need (date range, action type, etc.), then click the "Export" button. The logs will be downloaded as a CSV file.',
  },
  {
    question: 'How do I change my notification settings?',
    answer: 'Go to Settings > Notifications. You can toggle different notification types on or off, including email notifications, push notifications, login alerts, and security alerts.',
  },
  {
    question: 'What permissions are required to manage roles?',
    answer: 'Only Super Administrators and users with the "Manage Roles" permission can create, edit, or delete roles. System roles (like Super Admin) cannot be modified or deleted.',
  },
  {
    question: 'How do I revoke access from a lost device?',
    answer: 'Go to Devices page, find the device you want to revoke, click the menu icon, and select "Disable" or "Remove". This will prevent the device from accessing the system.',
  },
  {
    question: 'Why is my session expiring frequently?',
    answer: 'Sessions expire for security reasons. The default session timeout is 24 hours. If you need longer sessions, contact your system administrator to adjust the security settings.',
  },
]

export default function Help() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    otherCategory: '',
    priority: '',
    description: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setSubmitSuccess(true)
    setTicketForm({ subject: '', category: '', otherCategory: '', priority: '', description: '' })
    
    setTimeout(() => setSubmitSuccess(false), 5000)
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Help & Support</h1>
        <p className="text-muted-foreground">
          Get help with the Lap IT Solutions ERP system. We're here to assist you.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone Support</p>
                <p className="text-lg font-semibold text-foreground">+639538930714 or +639171147882</p>
                <p className="text-xs text-muted-foreground">Mon-Sat 9AM-6PM PHT</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-500/10 p-3">
                <MessageCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Viber</p>
                <p className="text-lg font-semibold text-foreground">+639538930714 or +639171147882</p>
                <p className="text-xs text-muted-foreground">24/7 Support</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-500/10 p-3">
                <Mail className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Support</p>
                <p className="text-lg font-semibold text-foreground">LapITSolutions09@gmail.com</p>
                <p className="text-xs text-muted-foreground">Response within 24hrs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-orange-500/10 p-3">
                <MapPin className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Office Location</p>
                <p className="text-sm font-semibold text-foreground">Marcela Bldg. Dr. 2 Jose Palma Gil. Street Barangay 34-D</p>
                <p className="text-xs text-muted-foreground">Davao City, Philippines</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Find quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-foreground pr-4">{faq.question}</span>
                    {expandedFAQ === index ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200',
                      expandedFAQ === index ? 'max-h-48' : 'max-h-0'
                    )}
                  >
                    <p className="px-4 pb-4 text-muted-foreground text-sm">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Send className="h-5 w-5" />
                Submit a Support Ticket
              </CardTitle>
              <CardDescription>
                Can't find what you're looking for? Submit a ticket and our team will help you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-green-500/10 p-4 mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Ticket Submitted!</h3>
                  <p className="text-muted-foreground text-sm">
                    We've received your support request. Our team will respond within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-foreground">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your issue"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                      required
                      className="bg-background border-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-foreground">Category</Label>
                    <Select
                      value={ticketForm.category}
                      onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value, otherCategory: value !== 'other' ? '' : prev.otherCategory }))}
                      required
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="account">Account & Access</SelectItem>
                        <SelectItem value="billing">Billing & Subscription</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {ticketForm.category === 'other' && (
                    <div className="space-y-2">
                      <Label htmlFor="otherCategory" className="text-foreground">Please specify</Label>
                      <Input
                        id="otherCategory"
                        placeholder="Describe your category"
                        value={ticketForm.otherCategory}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, otherCategory: e.target.value }))}
                        required
                        className="bg-background border-input"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-foreground">Priority</Label>
                    <Select
                      value={ticketForm.priority}
                      onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value }))}
                      required
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - General inquiry</SelectItem>
                        <SelectItem value="medium">Medium - Affecting work</SelectItem>
                        <SelectItem value="high">High - Critical issue</SelectItem>
                        <SelectItem value="urgent">Urgent - System down</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-foreground">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Please describe your issue in detail. Include steps to reproduce if reporting a bug."
                      rows={5}
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                      required
                      className="bg-background border-input resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground text-base">
                <Clock className="h-5 w-5" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monday - Saturday</span>
                <span className="text-foreground font-medium">9:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sunday</span>
                <span className="text-foreground font-medium">Closed</span>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  All times are in Philippine Standard Time (PHT/UTC+8). 
                  For urgent matters outside business hours, please use Viber.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
