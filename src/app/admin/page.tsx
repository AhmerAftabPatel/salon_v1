'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, Edit, Trash2, Filter, MapPin, ArrowLeft, Check, X, Menu, X as CloseIcon } from 'lucide-react';
import Link from 'next/link';
import { formatCentralTime, formatTime, CENTRAL_TIMEZONE, getCurrentCentralTime, isTodayCentral } from '@/lib/timezone';

interface Appointment {
  _id: string;
  name: string;
  phoneNumber: string;
  email: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPanel() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [editingAppointment, setEditingAppointment] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    status: 'pending' as 'pending' | 'confirmed' | 'cancelled' | 'completed',
    notes: ''
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get today's date in Central Time
  const today = getCurrentCentralTime();
  const todayStr = formatCentralTime(today, 'yyyy-MM-dd');

  useEffect(() => {
    // Set default date filter to today when component mounts
    if (activeTab === 'today') {
      setDateFilter(todayStr);
      setFilter('all');
    } else {
      setDateFilter('');
      setFilter('confirmed');
    }
  }, [activeTab, todayStr]);

  useEffect(() => {
    fetchAppointments();
  }, [filter, dateFilter, activeTab]);

  const fetchAppointments = async () => {
    try {
      let url = '/api/appointments';
      const params = new URLSearchParams();
      
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      if (dateFilter) {
        params.append('date', dateFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setAppointments(data.appointments);
      } else {
        console.error('Failed to fetch appointments:', data.error);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointment = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setEditingAppointment(null);
        fetchAppointments();
      } else {
        console.error('Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const deleteAppointment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        const response = await fetch(`/api/appointments/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchAppointments();
        } else {
          console.error('Failed to delete appointment');
        }
      } catch (error) {
        console.error('Error deleting appointment:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Check className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'cancelled':
        return <X className="h-3 w-3" />;
      case 'completed':
        return <Check className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const isAppointmentPast = (appointment: Appointment) => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = getCurrentCentralTime();
    return appointmentDateTime < now;
  };

  const isAppointmentCompleted = (appointment: Appointment) => {
    return appointment.status === 'completed';
  };

  const getRowStyle = (appointment: Appointment) => {
    if (isAppointmentCompleted(appointment)) {
      return 'bg-gray-100 text-gray-500';
    }
    if (isAppointmentPast(appointment)) {
      return 'bg-gray-50 text-gray-400';
    }
    return 'hover:bg-gray-50';
  };

  // Mobile card view for appointments
  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <div className={`bg-white border rounded-lg p-4 mb-4 shadow-sm ${getRowStyle(appointment)}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{appointment.name}</h3>
          <div className="text-sm text-gray-500 mt-1 flex items-center">
            <Phone className="h-3 w-3 mr-1" />
            {appointment.phoneNumber}
          </div>
          <div className="text-sm text-gray-500 mt-1 flex items-center">
            <Mail className="h-3 w-3 mr-1" />
            {appointment.email}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setEditingAppointment(appointment._id);
              setEditForm({
                status: appointment.status,
                notes: appointment.notes || ''
              });
            }}
            className="text-purple-600 hover:text-purple-900 p-1"
            disabled={isAppointmentCompleted(appointment)}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => deleteAppointment(appointment._id)}
            className="text-red-600 hover:text-red-900 p-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
          <span className={isAppointmentCompleted(appointment) ? 'text-gray-400' : 'text-gray-900'}>
            {formatCentralTime(new Date(appointment.date), 'MMM dd, yyyy')}
          </span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-gray-500" />
          <span className={isAppointmentCompleted(appointment) ? 'text-gray-400' : 'text-gray-900'}>
            {formatTime(appointment.time)}
          </span>
        </div>
      </div>
      
      <div className="mt-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
          {getStatusIcon(appointment.status)}
          <span className="ml-1 capitalize">{appointment.status}</span>
        </span>
        {(isAppointmentPast(appointment) || isAppointmentCompleted(appointment)) && (
          <div className="text-xs text-gray-400 mt-2">
            {isAppointmentCompleted(appointment) ? 'Completed' : 'Time passed'}
          </div>
        )}
      </div>
      
      {appointment.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Notes:</span> {appointment.notes}
          </p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-purple-600">
                Salon Management
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                href="/book" 
                className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Book Appointment
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-purple-600 p-2"
              >
                {mobileMenuOpen ? <CloseIcon className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link 
                  href="/book" 
                  className="text-gray-700 hover:text-purple-600 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Book Appointment
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Manage all salon appointments and bookings.</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white shadow-lg rounded-lg mb-4 sm:mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 px-4 sm:px-6">
              <button
                onClick={() => setActiveTab('today')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'today'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Today&apos;s Appointments
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'upcoming'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upcoming Confirmed
              </button>
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-row sm:gap-4">
            <div className="flex-1">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                id="status-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            {/* Date Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Filter
              </label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* Timezone Info */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                Central Time
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  if (activeTab === 'today') {
                    setDateFilter(todayStr);
                    setFilter('all');
                  } else {
                    setDateFilter('');
                    setFilter('confirmed');
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {activeTab === 'today' ? 'Today&apos;s Appointments' : 'Upcoming Confirmed Appointments'} ({appointments.length})
            </h2>
            {activeTab === 'today' && (
              <p className="text-sm text-gray-500 mt-1">
                Showing appointments for {formatCentralTime(today, 'EEEE, MMMM dd, yyyy')}
              </p>
            )}
          </div>
          
          {appointments.length === 0 ? (
            <div className="px-4 sm:px-6 py-12 text-center">
              <p className="text-gray-500">
                {activeTab === 'today' 
                  ? 'No appointments scheduled for today.' 
                  : 'No upcoming confirmed appointments found.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden p-4 sm:p-6">
                {appointments.map((appointment) => (
                  <AppointmentCard key={appointment._id} appointment={appointment} />
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <tr key={appointment._id} className={getRowStyle(appointment)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{appointment.name}</div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {appointment.phoneNumber}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Mail className="h-3 w-3 mr-1" />
                              {appointment.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            {formatCentralTime(new Date(appointment.date), 'MMM dd, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            {formatTime(appointment.time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1 capitalize">{appointment.status}</span>
                          </span>
                          {(isAppointmentPast(appointment) || isAppointmentCompleted(appointment)) && (
                            <div className="text-xs text-gray-400 mt-1">
                              {isAppointmentCompleted(appointment) ? 'Completed' : 'Time passed'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {appointment.notes || 'No notes'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingAppointment(appointment._id);
                                setEditForm({
                                  status: appointment.status,
                                  notes: appointment.notes || ''
                                });
                              }}
                              className="text-purple-600 hover:text-purple-900"
                              disabled={isAppointmentCompleted(appointment)}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteAppointment(appointment._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Edit Modal */}
        {editingAppointment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
            <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Appointment</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      id="status"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'pending' | 'confirmed' | 'cancelled' | 'completed' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => updateAppointment(editingAppointment)}
                      className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => setEditingAppointment(null)}
                      className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 