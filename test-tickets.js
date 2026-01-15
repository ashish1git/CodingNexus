/**
 * Test Ticket System
 * Tests: Create ticket → Admin sees it → Admin replies → Student sees reply
 */

const apiBaseUrl = 'http://localhost:5000/api';

// Mock auth token (replace with real token)
const studentToken = localStorage.getItem('token');
const adminToken = localStorage.getItem('adminToken');

async function apiCall(method, endpoint, body = null, token = studentToken) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${apiBaseUrl}${endpoint}`, options);
  return response.json();
}

async function testTicketSystem() {
  console.log('🧪 Testing Ticket System...\n');

  try {
    // 1. Student creates ticket
    console.log('1️⃣ Student creating ticket...');
    const createResult = await apiCall('POST', '/student/tickets', {
      subject: 'Test Issue',
      message: 'This is a test ticket message',
      priority: 'high'
    }, studentToken);

    if (!createResult.success) {
      console.error('❌ Failed to create ticket:', createResult);
      return;
    }

    const ticketId = createResult.data.id;
    console.log('✅ Ticket created:', ticketId);
    console.log('   Subject:', createResult.data.subject);
    console.log('   Message:', createResult.data.message);

    // 2. Admin views all tickets
    console.log('\n2️⃣ Admin viewing all tickets...');
    const adminViewResult = await apiCall('GET', '/admin/tickets', null, adminToken);
    
    if (!adminViewResult.success) {
      console.error('❌ Failed to fetch admin tickets:', adminViewResult);
      return;
    }

    const adminTicket = adminViewResult.tickets.find(t => t.id === ticketId);
    if (!adminTicket) {
      console.error('❌ Ticket not found in admin view');
      return;
    }

    console.log('✅ Admin can see ticket');
    console.log('   Student:', adminTicket.studentName);
    console.log('   Subject:', adminTicket.subject);
    console.log('   Message:', adminTicket.message);

    // 3. Admin sends reply
    console.log('\n3️⃣ Admin sending reply...');
    const replyResult = await apiCall('PUT', `/admin/tickets/${ticketId}`, {
      reply: 'We are working on your issue. Thank you for contacting us!',
      status: 'in-progress'
    }, adminToken);

    if (!replyResult.success) {
      console.error('❌ Failed to send reply:', replyResult);
      return;
    }

    console.log('✅ Reply sent successfully');
    console.log('   Status:', replyResult.data.status);

    // 4. Student checks for responses
    console.log('\n4️⃣ Student checking ticket for responses...');
    const studentCheckResult = await apiCall('GET', '/student/tickets', null, studentToken);

    if (!studentCheckResult.success) {
      console.error('❌ Failed to fetch student tickets:', studentCheckResult);
      return;
    }

    const studentTicket = studentCheckResult.data.find(t => t.id === ticketId);
    if (!studentTicket) {
      console.error('❌ Ticket not found in student view');
      return;
    }

    const responses = studentTicket.responses || [];
    if (responses.length === 0) {
      console.error('❌ No responses found for student ticket');
      return;
    }

    console.log('✅ Student can see admin replies');
    responses.forEach((r, i) => {
      console.log(`   Reply ${i + 1}: ${r.from === 'admin' ? '👨‍💼 Admin' : '👤 Student'}`);
      console.log(`   Message: ${r.message}`);
      console.log(`   Time: ${new Date(r.timestamp).toLocaleString()}`);
    });

    console.log('\n✨ All tests passed! Ticket system is working correctly!');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run test when DOM is ready
document.addEventListener('DOMContentLoaded', testTicketSystem);
