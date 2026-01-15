export const getLabel = (type) => {
  const labels = {
    'APPOINTMENT_ACCEPTED': 'Appointment Accepted',
    'APPOINTMENT_DECLINED': 'Appointment Declined',
    'APPOINTMENT_REQUEST': 'New Appointment Request',
    'APPOINTMENT_RESPONSE': 'Appointment Response',
    'APPOINTMENT_CANCELLED': 'Appointment Cancelled',
    'APPOINTMENT_EXPIRED': 'Appointment Expired',
    'APPOINTMENT_REMINDER': 'Appointment Reminder',
    'APPOINTMENT_UPDATE': 'Appointment Updated',
    
    'ACCEPT': 'Accepted',
    'DECLINE': 'Declined',
    
    'RESCHEDULE REQUEST': 'Reschedule Request',
    'RESCHEDULE_REQUEST': 'Reschedule Request',
    'RESCHEDULE_APPROVED': 'Reschedule Approved',
    'RESCHEDULE APPROVED': 'Reschedule Approved',
    'RESCHEDULE_DECLINED': 'Reschedule Declined',
    'RESCHEDULE DECLINED': 'Reschedule Declined',
    'RESCHEDULE EXPIRED': 'Reschedule Request Expired',
  };
  
  return labels[type] || type;
};

export const getClass = (notif) => {
  const classes = ['notification-item'];
  
  if (notif.isRead === 0 || notif.isRead === false) {
    classes.push('unread');
  }
  
  const actionType = notif.actionType;
  
  if (!actionType) {
    return classes.join(' ');
  }
  
  if (actionType === 'ACCEPT' || actionType === 'APPOINTMENT_ACCEPTED') {
    classes.push('notification-accepted');
  } 
  else if (actionType === 'DECLINE' || actionType === 'APPOINTMENT_DECLINED' || actionType === 'APPOINTMENT_CANCELLED') {
    classes.push('notification-declined');
  } 
  else if (actionType === 'APPOINTMENT_EXPIRED') {
    classes.push('notification-expired');
  }
  else if (actionType === 'APPOINTMENT_REQUEST' || actionType === 'APPOINTMENT_RESPONSE') {
    classes.push('notification-request');
  } 
  else if (actionType === 'APPOINTMENT_REMINDER') {
    classes.push('notification-reminder');
  } 
  else if (actionType === 'APPOINTMENT_UPDATE') {
    classes.push('notification-update');
  }
  else if (actionType === 'RESCHEDULE REQUEST' || actionType === 'RESCHEDULE_REQUEST') {
    classes.push('notification-reschedule');
  }
  else if (actionType === 'RESCHEDULE_APPROVED' || actionType === 'RESCHEDULE APPROVED') {
    classes.push('notification-reschedule-approved');
  }
  else if (actionType === 'RESCHEDULE_DECLINED' || actionType === 'RESCHEDULE DECLINED') {
    classes.push('notification-reschedule-declined');
  }
  
  return classes.join(' ');
};