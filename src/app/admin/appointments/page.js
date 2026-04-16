import { redirect } from 'next/navigation';

export default function AppointmentsRedirect() {
  redirect('/admin/calendar');
}
