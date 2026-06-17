// fitur tampilkanpassword
function togglePassword(id) {
  var input = document.getElementById(id);
  input.type = (input.type === 'password') ? 'text' : 'password';
}

// form login
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const login_id = document.getElementById('login_id').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id, password })
  });

  const data = await res.json();
  if (data.success) {
    alert('Login berhasil!');
    window.location.href = 'dashboard.html';
  } else {
    alert('Login gagal: ' + data.message);
  }
});

// form pendaftaran
document.getElementById('registerForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const member_id = document.getElementById('reg_member_id').value;
  const nama = document.getElementById('reg_nama').value;
  const password = document.getElementById('regPass').value;
  const confirm = document.getElementById('regPassConfirm').value;

  if (password !== confirm) {
    alert('Password tidak sama!');
    return;
  }

  const res = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id, nama, password })
  });

  const data = await res.json();
  if (data.success) {
    alert('Pendaftaran berhasil! Silakan login.');
    showTab('login');
  } else {
    alert('Pendaftaran gagal: ' + data.message);
  }
});