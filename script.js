const campoTarefa = document.getElementById('campo-tarefa');
const botaoAdicionar = document.getElementById('botao-adicionar');
const listaTarefas = document.getElementById('lista-tarefas');
const contadorTarefas = document.getElementById('contador-tarefas');
const botaoAlternarTema = document.getElementById('botao-alternar-tema');
const filtros = document.getElementById('filtros');
const botaoLimpar = document.getElementById('botao-limpar');

const CHAVE_TAREFAS = 'painel-tarefas:tarefas';
const CHAVE_TEMA = 'painel-tarefas:tema';
const CHAVE_FILTRO = 'painel-tarefas:filtro';

let filtroAtual = 'todas';

// ---------- Persistência (localStorage) ----------
function lerArmazenado(chave) {
    try {
        return localStorage.getItem(chave);
    } catch (erro) {
        return null;
    }
}

function gravarArmazenado(chave, valor) {
    try {
        localStorage.setItem(chave, valor);
    } catch (erro) {
        // armazenamento indisponível: o site segue funcionando sem salvar
    }
}

function salvarTarefas() {
    const tarefas = [...listaTarefas.querySelectorAll('.item-tarefa')].map((item) => ({
        texto: item.querySelector('span').textContent,
        concluida: item.classList.contains('concluido'),
    }));
    gravarArmazenado(CHAVE_TAREFAS, JSON.stringify(tarefas));
}

function carregarTarefas() {
    try {
        const tarefas = JSON.parse(lerArmazenado(CHAVE_TAREFAS) || '[]');
        if (Array.isArray(tarefas)) {
            tarefas.forEach((t) => criarTarefa(String(t.texto), Boolean(t.concluida)));
        }
    } catch (erro) {
        // dados corrompidos: começa com a lista vazia
    }
}

// ---------- Tarefas ----------
function criarTarefa(texto, concluida = false) {
    const itemLista = document.createElement('li');
    itemLista.className = 'item-tarefa';
    if (concluida) itemLista.classList.add('concluido');

    itemLista.innerHTML = `
        <span></span>
        <div class="acoes-tarefa">
            <button class="botao-acao concluir" title="Concluir"><i class="fa-regular fa-circle-check"></i></button>
            <button class="botao-acao excluir" title="Excluir"><i class="fa-solid fa-trash"></i></button>
        </div>
    `;
    // textContent evita que HTML digitado pelo usuário seja interpretado
    const span = itemLista.querySelector('span');
    span.textContent = texto;
    span.title = 'Clique duas vezes para editar';
    span.addEventListener('dblclick', () => editarTarefa(itemLista));

    itemLista.querySelector('.concluir').addEventListener('click', () => {
        itemLista.classList.toggle('concluido');
        atualizarLista();
    });
    itemLista.querySelector('.excluir').addEventListener('click', () => {
        itemLista.remove();
        atualizarLista();
    });

    listaTarefas.appendChild(itemLista);
}

function adicionarTarefa() {
    const textoTarefa = campoTarefa.value.trim();

    if (textoTarefa === '') {
        alert('Por favor, digite uma tarefa!');
        return;
    }
    criarTarefa(textoTarefa);
    campoTarefa.value = '';
    atualizarLista();
}

// Feature 1: editar tarefa com duplo clique (Enter salva, Esc cancela)
function editarTarefa(itemLista) {
    const span = itemLista.querySelector('span');
    if (!span) return;
    const textoOriginal = span.textContent;

    const campoEdicao = document.createElement('input');
    campoEdicao.type = 'text';
    campoEdicao.className = 'campo-edicao';
    campoEdicao.maxLength = 40;
    campoEdicao.value = textoOriginal;
    span.replaceWith(campoEdicao);
    campoEdicao.focus();
    campoEdicao.select();

    let finalizado = false;
    function finalizar(salvar) {
        if (finalizado) return;
        finalizado = true;
        const novoTexto = campoEdicao.value.trim();
        const novoSpan = document.createElement('span');
        novoSpan.textContent = salvar && novoTexto !== '' ? novoTexto : textoOriginal;
        novoSpan.title = 'Clique duas vezes para editar';
        novoSpan.addEventListener('dblclick', () => editarTarefa(itemLista));
        campoEdicao.replaceWith(novoSpan);
        salvarTarefas();
    }

    campoEdicao.addEventListener('keydown', (evento) => {
        if (evento.key === 'Enter') finalizar(true);
        if (evento.key === 'Escape') finalizar(false);
    });
    campoEdicao.addEventListener('blur', () => finalizar(true));
}

// Feature 2: filtrar tarefas (todas / pendentes / concluídas)
function aplicarFiltro() {
    listaTarefas.querySelectorAll('.item-tarefa').forEach((item) => {
        const concluida = item.classList.contains('concluido');
        const visivel =
            filtroAtual === 'todas' ||
            (filtroAtual === 'pendentes' && !concluida) ||
            (filtroAtual === 'concluidas' && concluida);
        item.hidden = !visivel;
    });
}

function atualizarContador() {
    const total = listaTarefas.querySelectorAll('.item-tarefa').length;
    const pendentes = listaTarefas.querySelectorAll('.item-tarefa:not(.concluido)').length;
    contadorTarefas.textContent =
        `${total} ${total === 1 ? 'tarefa' : 'tarefas'} na lista · ` +
        `${pendentes} ${pendentes === 1 ? 'pendente' : 'pendentes'}`;
    botaoLimpar.disabled = total - pendentes === 0;
}

// Feature 3: limpar todas as tarefas concluídas de uma vez
botaoLimpar.addEventListener('click', () => {
    const concluidas = listaTarefas.querySelectorAll('.item-tarefa.concluido');
    if (concluidas.length === 0) return;
    const mensagem = `Remover ${concluidas.length} ${concluidas.length === 1 ? 'tarefa concluída' : 'tarefas concluídas'}?`;
    if (!confirm(mensagem)) return;
    concluidas.forEach((item) => item.remove());
    atualizarLista();
});

function atualizarLista() {
    aplicarFiltro();
    atualizarContador();
    salvarTarefas();
}

function selecionarFiltro(nome) {
    filtroAtual = nome;
    filtros.querySelectorAll('.botao-filtro').forEach((b) =>
        b.classList.toggle('ativo', b.dataset.filtro === nome)
    );
    aplicarFiltro();
    gravarArmazenado(CHAVE_FILTRO, nome);
}

filtros.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.botao-filtro');
    if (!botao) return;
    selecionarFiltro(botao.dataset.filtro);
});

// ---------- Tema ----------
function aplicarTema(escuro) {
    document.body.classList.toggle('modo-escuro', escuro);
    const iconeTema = botaoAlternarTema.querySelector('i');
    iconeTema.classList.toggle('fa-moon', !escuro);
    iconeTema.classList.toggle('fa-sun', escuro);
}

botaoAlternarTema.addEventListener('click', () => {
    const escuro = !document.body.classList.contains('modo-escuro');
    aplicarTema(escuro);
    gravarArmazenado(CHAVE_TEMA, escuro ? 'escuro' : 'claro');
});

botaoAdicionar.addEventListener('click', adicionarTarefa);

campoTarefa.addEventListener('keypress', (evento) => {
    if (evento.key === 'Enter') {
        adicionarTarefa();
    }
});

// ---------- Inicialização ----------
aplicarTema(lerArmazenado(CHAVE_TEMA) === 'escuro');
carregarTarefas();
const filtroSalvo = lerArmazenado(CHAVE_FILTRO);
selecionarFiltro(['todas', 'pendentes', 'concluidas'].includes(filtroSalvo) ? filtroSalvo : 'todas');
atualizarContador();