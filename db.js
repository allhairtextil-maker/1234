// ALL HAIR — Camada de dados (Firebase + localStorage fallback)
// Este arquivo substitui o localStorage em todos os módulos

const _firebaseConfig = {
  apiKey: "AIzaSyCe0Ok7K6I9oFze8qA2Mglq-mQfFU6XBz4",
  authDomain: "all-hair-sistema.firebaseapp.com",
  projectId: "all-hair-sistema",
  storageBucket: "all-hair-sistema.firebasestorage.app",
  messagingSenderId: "1026016991661",
  appId: "1:1026016991661:web:a9cfceab4e9c7b26062924"
};

// Inicializa Firebase via CDN
let _db = null;
let _firebaseReady = false;

(async function initFirebase() {
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore, doc, setDoc, getDoc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const app = initializeApp(_firebaseConfig);
    _db = getFirestore(app);
    _firebaseReady = true;
    
    window._fsDoc = doc;
    window._fsSetDoc = setDoc;
    window._fsGetDoc = getDoc;
    window._fsOnSnapshot = onSnapshot;
    window._fsDb = _db;
    
    console.log('[AllHair] Firebase conectado!');
    
    // Migra dados do localStorage para Firebase (primeira vez)
    await migrarLocalStorage();
    
    // Avisa todos os módulos que o Firebase está pronto
    window.dispatchEvent(new Event('firebase-ready'));
    
  } catch(e) {
    console.warn('[AllHair] Firebase indisponível, usando localStorage:', e.message);
    _firebaseReady = false;
    window.dispatchEvent(new Event('firebase-ready'));
  }
})();

const EMPRESA = 'allhair';

// ===== API PRINCIPAL =====

window.DB = {
  
  // Ler dados
  async get(chave) {
    const localKey = 'allhair_' + chave;
    if (_firebaseReady && _db) {
      try {
        const snap = await window._fsGetDoc(window._fsDoc(_db, 'empresas', EMPRESA, 'dados', chave));
        if (snap.exists()) {
          const dados = JSON.parse(snap.data().json);
          // Atualiza cache local
          localStorage.setItem(localKey, JSON.stringify(dados));
          return dados;
        }
      } catch(e) {
        console.warn('[DB.get] Firebase error, usando local:', e.message);
      }
    }
    // Fallback localStorage
    const local = localStorage.getItem(localKey);
    return local ? JSON.parse(local) : null;
  },

  // Salvar dados
  async set(chave, dados) {
    const localKey = 'allhair_' + chave;
    // Sempre salva local primeiro (rápido)
    localStorage.setItem(localKey, JSON.stringify(dados));
    // Salva no Firebase em background
    if (_firebaseReady && _db) {
      try {
        await window._fsSetDoc(window._fsDoc(_db, 'empresas', EMPRESA, 'dados', chave), {
          json: JSON.stringify(dados),
          updatedAt: Date.now(),
          chave: chave
        });
      } catch(e) {
        console.warn('[DB.set] Firebase error:', e.message);
      }
    }
  },

  // Escutar mudanças em tempo real
  listen(chave, callback) {
    if (_firebaseReady && _db) {
      return window._fsOnSnapshot(
        window._fsDoc(_db, 'empresas', EMPRESA, 'dados', chave),
        (snap) => {
          if (snap.exists()) {
            const dados = JSON.parse(snap.data().json);
            localStorage.setItem('allhair_' + chave, JSON.stringify(dados));
            callback(dados);
          }
        }
      );
    }
    return null;
  },

  isReady() { return _firebaseReady; }
};

// Migra dados existentes do localStorage para Firebase
async function migrarLocalStorage() {
  const chaves = [
    'pedidos','clientes','fornecedores2','compras',
    'produtos','cores','embalagens','etiquetas',
    'producoes2','envios_v2','faccionistas',
    'estoque_v2','movimentos','reservas',
    'recebimentos','pagamentos','despesas',
    'representantes','comissoes',
    'socios','socios_mov',
    'leads','melhorias','config',
    'transportadoras','caixa','empresa',
    'usuarios','pins'
  ];
  
  let migrou = false;
  for (const chave of chaves) {
    const local = localStorage.getItem('allhair_' + chave);
    if (local) {
      try {
        const snap = await window._fsGetDoc(window._fsDoc(_db, 'empresas', EMPRESA, 'dados', chave));
        if (!snap.exists()) {
          // Só migra se ainda não existir no Firebase
          await window._fsSetDoc(window._fsDoc(_db, 'empresas', EMPRESA, 'dados', chave), {
            json: local,
            updatedAt: Date.now(),
            chave: chave,
            migradoDe: 'localStorage'
          });
          migrou = true;
          console.log('[DB] Migrado:', chave);
        }
      } catch(e) {
        // Ignora erros individuais
      }
    }
  }
  if (migrou) console.log('[AllHair] Migração do localStorage concluída!');
}
