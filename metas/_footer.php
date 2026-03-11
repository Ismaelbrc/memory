  </div><!-- /main-content -->
</div><!-- /d-flex -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
// Generic AJAX delete helper
function confirmDelete(url, message, onSuccess) {
  if (!confirm(message || 'Confirma a exclusão?')) return;
  fetch(url, { method: 'POST' })
    .then(r => r.json())
    .then(d => {
      if (d.success) { if (onSuccess) onSuccess(); else location.reload(); }
      else alert(d.error || 'Erro ao excluir.');
    })
    .catch(() => alert('Erro de comunicação.'));
}

// Auto-dismiss alerts
document.querySelectorAll('.alert-dismissible').forEach(el => {
  setTimeout(() => { el.classList.add('fade'); setTimeout(() => el.remove(), 300); }, 4000);
});
</script>
</body>
</html>
