# 🏨 Sistema de Gestão para Pousada (Offline + PWA)

## 📘 Visão Geral

Este é um sistema web para gestão de uma pousada que funciona **completamente offline** e pode ser instalado como um **PWA (Progressive Web App)** em um PC ou tablet. Ele cobre todo o fluxo operacional básico da recepção, sem depender da internet.

---

## 🧑‍💼 Usuário-alvo

Recepcionista da pousada — usa o sistema para registrar check-ins, check-outs, reservas, consumo de hóspedes e visualizar relatórios de faturamento.

---

## 🚀 Funcionalidades

- 🛎️ **Check-In** de hóspedes com seleção de chalé/quarto e datas
- 🚪 **Check-Out** com resumo do consumo e valor total
- 📆 **Calendário de Ocupação** com cores para ocupado/livre
- 📝 **Nova Reserva** com escolha futura de datas e cliente
- 🍽️ **Registro de Consumo** (restaurante, frigobar, etc)
- 📊 **Faturamento** mensal e anual
- 💾 **Funciona 100% Offline**
- 📱 **Instalável via PWA**
- 🔐 (Opcional) Acesso com senha
- 🧯 (Futuro) Backup manual dos dados (.json)

---

## 🧭 Fluxo do Usuário

1. Acessa o app no tablet/PC
2. Vê o calendário com os chalés e dias
3. Faz check-in ou reserva diretamente pela interface
4. Registra consumos diários dos hóspedes
5. No check-out, gera resumo da estadia e custos
6. Consulta painel de faturamento mensal/anual

---

## 🏗️ Tecnologias

- **Next.js + TypeScript**
- **TailwindCSS** para responsividade
- **IndexedDB** para salvar dados localmente
- **idb** (biblioteca para IndexedDB)
- **PWA** com manifest + service worker

---

## 🛣️ Roadmap

| Etapa      | Tarefa                                                   | Status   |
|------------|----------------------------------------------------------|----------|
| Estrutura  | Criar estrutura inicial do projeto                       | ✅ Pronto |
| Layout     | Criar componentes base com Tailwind                      | 🔜        |
| Check-In   | Tela funcional com armazenamento local                   | 🔜        |
| Check-Out  | Tela com cálculo de custos + consumo                     | 🔜        |
| Calendário | Visualizar quartos por dia e status                      | 🔜        |
| Faturamento| Relatórios de receita mensal/anual                       | 🔜        |
| PWA        | Manifesto + instalação no tablet/PC                      | 🔜        |
| Backup     | Exportar dados em .json                                  | 🔜        |

---

## 🗃️ Estrutura de Pastas (prevista)

```bash
src/
│
├── components/        # Componentes reutilizáveis
├── pages/             # Páginas (check-in, reservas, etc)
├── db/                # Lógica para IndexedDB
├── styles/            # Tailwind e estilos globais
├── utils/             # Funções auxiliares
└── types/             # Tipagens TypeScript
