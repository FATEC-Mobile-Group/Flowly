<!-- Banner da Aplicação -->
<p align="center">
  <img width="1296" height="505" alt="image" src="https://github.com/user-attachments/assets/f65b2ed4-d2ad-4677-83d6-f6f8af3137a5" />
</p>

<h1 align="center">📱 Flowly</h1>

<p align="center">
  Um aplicativo mobile focado em gestão de tarefas e organização de fluxos de trabalho — inspirado em ferramentas como <strong>Trello</strong>, <strong>Miro</strong> e outras plataformas colaborativas.
</p>

---

## 📌 Sobre o Flowly

O **Flowly** é um aplicativo mobile projetado para facilitar a criação, organização e acompanhamento de tarefas de forma visual e intuitiva.  
Seu objetivo é oferecer uma experiência fluida para equipes e usuários individuais que desejam estruturar seus projetos através de quadros, listas e cartões — semelhante a apps populares de produtividade, porém com uma identidade própria.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Maui**
- **C#**

### Backend
- **Node.js**
- **Express.js**
- **MongoDB**
- **Azure**
- **Nodemailer**

---

## 🚀 Como Rodar o Projeto Localmente

### 📂 1. Clonar o repositório

```bash
git clone https://github.com/FATEC-Mobile-Group/Flowly.git
cd Flowly
```
### 🔧 2. Backend — Instalação e Execução
> Dentro da pasta backend:
- Instalar dependências:
```bash
npm install
```
- Crie um arquivo .env e configure as varáveis de ambiente:
```bash
MONGO_URI=sua_conexao_com_banco_de_dados
JWT_SECRET=seu_segredo_jwt
PORT=sua_porta
AUTH_EMAIL=seu_email_para_enviar_mensagens
AUTH_PASS=senha_de_app_para_o_email
EMAIL_PORT=sua_porta_dp_email
HOST=host_smtp_do_email
SERVICE=tipo_do_email(gmail, outlook...)
SECURE=true(para porta 465) ou false(para TLSS)
BASE_URL=url_base(como localhost ou servidor)
```
- Rodar servidor:
```bash
npm start
```

### 📱 2. Frontend — Instalação e Execução
> Dentro da pasta frontend:
- Abra a solução através do Visual Studio
- Aguarde o programa abrir o projeto
- Rodar o projeto no método de sua preferência (Windows Machine, Emuladores...)
