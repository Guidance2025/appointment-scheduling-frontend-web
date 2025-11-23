export const getLabel = (type) => {
    const labels = {
      'APPOINTMENT_ACCEPTED': 'Appointment Accepted',
      'APPOINTMENT_DECLINED': 'Appointment Declined',
      'APPOINTMENT_REQUEST': 'New Appointment Request',
      'APPOINTMENT_CANCELLED': 'Appointment Cancelled',
      'ACCEPT': 'Accepted',
      'DECLINE': 'Declined'
    };
    return labels[type] || type;
  };

export const getClass = (notif) => {
    let className = 'notification-item';
    
    if (notif.isRead === 0 || notif.isRead === false) {
      className += ' unread';
    }
    
    if (notif.actionType?.includes('ACCEPT')) {
      className += ' notification-accepted';
    } else if (notif.actionType?.includes('DECLINE')) {
      className += ' notification-declined';
    } else if (notif.actionType === 'APPOINTMENT_REQUEST') {
      className += ' notification-request';
    }
    
    return className;
  };



  