// ALL HAIR — Controle de Acesso Global
(function(){
  const sessao = JSON.parse(localStorage.getItem('allhair_sessao')||'{}');
  const isViewer = sessao.role === 'viewer';

  if(!isViewer) return; // admin passa direto

  // Aguarda o DOM carregar
  function aplicarRestricoes(){
    // Esconde todos os botões de ação (salvar, criar, editar, excluir)
    const seletores = [
      '.btn-primary',
      '.btn-save',
      '.btn-green',
      '[onclick*="salvar"]',
      '[onclick*="confirmar"]',
      '[onclick*="open"]',
      '[onclick*="delete"]',
      '[onclick*="del"]',
      '[onclick*="marcar"]',
      '[onclick*="pagar"]',
      '[onclick*="expedir"]',
      '.btn-icon.ok',
      '.btn-icon.danger',
    ];

    document.querySelectorAll(seletores.join(',')).forEach(el => {
      el.style.display = 'none';
    });

    // Bloqueia inputs e selects
    document.querySelectorAll('input, select, textarea').forEach(el => {
      el.setAttribute('readonly', true);
      el.setAttribute('disabled', true);
      el.style.cursor = 'not-allowed';
      el.style.opacity = '.7';
    });


  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', aplicarRestricoes);
  } else {
    aplicarRestricoes();
  }

  // Reaplica após renders dinâmicos
  setInterval(aplicarRestricoes, 2000);
})();
