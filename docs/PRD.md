# **Product Requirements Document (PRD): Gerador de Grade Curricular Acadêmica**

## **1\. Visão Geral e Objetivo**

Desenvolver uma aplicação web SPA (Single Page Application) para auxiliar estudantes na montagem de seus calendários acadêmicos semanais. O sistema consumirá dados de arquivos CSV locais contendo a oferta de disciplinas, permitindo ao usuário interagir com uma grade de horários para selecionar aulas, visualizar conflitos e organizar sua rotina, com a possibilidade de exportar o resultado final como imagem.

## **2\. Stack Tecnológica Obrigatória**

* **Framework:** Next.js (utilizando tipagem forte com TypeScript para garantir consistência dos dados do CSV e do grid).  
* **Estilização:** Tailwind CSS (essencial para grid CSS, flexbox, cores e manipulação rápida de z-index e opacidade nas sombras de hover).  
* **Processamento de Dados:** Leitor de CSV (ex: papaparse ou nativo via Node.js em build time/server-side).  
* **Exportação:** Biblioteca para captura de DOM para imagem (ex: html-to-image ou html2canvas).

## **3\. Lógica de Dados e Processamento (CSV)**

A aplicação deve carregar automaticamente arquivos CSV estáticos localizados na pasta /data do repositório do projeto.

### **3.1. Processamento do Nome do Arquivo (Cursos)**

A identificação de qual curso uma disciplina obrigatória pertence deve ser inferida pela leitura dinâmica do nome do arquivo CSV.

* **Padrão de Arquivo Obrigatório:** Publicação Oferta Graduação \[Semestre\] \- \[SIGLA\] \[Semestre\].csv (Ex: Publicação Oferta Graduação 26.1 \- CC 26.1.csv).  
* **Mapeamento de Siglas:**  
  * **EC:** Engenharia da Computação  
  * **CC:** Ciência da Computação  
  * **IA:** Inteligência Artificial  
  * **SI:** Sistemas de Informação  
* **Padrão de Arquivo Eletivas:** Arquivos contendo Eletivas no nome (Ex: Publicação Oferta Graduação 26.1 \- Eletivas 26.1.csv). As disciplinas lidas deste arquivo são tratadas como transversais aos cursos.

### **3.2. Regras de Classificação das Disciplinas**

* **Obrigatórias:** Disciplinas provindas dos arquivos identificados por siglas (EC, CC, IA, SI) que possuam a coluna "Período" com valor numérico (ex: 1, 2, 3).  
* **Eletivas:** Disciplinas provindas do arquivo de "Eletivas" ou onde a coluna "Período" estiver vazia/inexistente.

### **3.3. Regras de Horários e Exceções**

* **Horário Fantasma:** Qualquer disciplina que contenha o horário 12:00-12:50 deve ter esse horário específico **ignorado** pelo parser (não deve renderizar na grade), pois trata-se de um horário fictício para cômputo de carga horária.

### **3.4. Persistência de Dados (LocalStorage)**

* **Salvamento Automático:** O estado atual do calendário (lista de disciplinas selecionadas e fixadas na grade) deve ser salvo automaticamente no localStorage do navegador do usuário a cada nova alteração (seja ao adicionar ou remover uma disciplina).  
* **Restauração de Estado:** Ao inicializar a aplicação (ou recarregar a página), o sistema deve verificar a existência de dados salvos no localStorage. Caso existam, a grade deve ser populada automaticamente com as escolhas anteriores, garantindo que o progresso do usuário não seja perdido.

## **4\. Interface de Usuário (UI) e Grid do Calendário**

A interface principal é um **Calendário Semanal** (Segunda a Sexta).

### **4.1. Estrutura do Grid (Horários Fixos)**

O calendário deve possuir linhas estritamente delimitadas pelos seguintes blocos de horários:

* **Manhã:** 08:00 às 09:50 | 10:00 às 11:50  
* **Tarde:** 13:00 às 14:50 | 15:00 às 16:50  
* **Noite:** 17:00 às 18:50 | 18:50 às 20:30

### **4.2. Identidade Visual (Cards e Células)**

### **4.2. Identidade Visual (Cards e Células)**

* **Obrigatórias vs Eletivas:** Devem possuir cores de fundo distintas e fáceis de identificar.  
* **Conteúdo do Card:** O card renderizado no calendário e na lista de opções deve exibir:  
  * Código e Nome da disciplina  
  * Nome do Professor  
  * **Sala/Lab** extraída da string de horário  
  * **Nome do Curso** (Engenharia da Computação, Ciência da Computação, etc.) ou a tag "Eletiva".
  * Em vez de ícones genéricos (sol/lua), o card deve informar explicitamente os **horários de aula** (ex: 08:00 - 09:50) e o **Período ideal** da disciplina.

## **5\. Fluxos de Interação (UX)**

O paradigma de interação é **baseado em cliques** (não utilizar drag-and-drop).

### **5.1. Seleção e Hover (Efeito Fantasma)**

1. **Catálogo Padrão e Botão Header:** Por padrão, a aplicação exibe um painel lateral listando todas as disciplinas disponíveis de todos os cursos. O usuário também pode abrir/reabrir esta visualização global a qualquer momento através de um botão no canto superior direito ("Catálogo de Disciplinas").  
2. **Gatilho de Seleção:** O usuário clica em uma célula de horário vazia (ex: Terça, 10:00 às 11:50).  
3. **Exibição Filtrada:** O painel lateral é filtrado, mostrando *apenas* os cards das disciplinas que têm aula naquele horário específico e que **ainda não foram selecionadas** e fixadas na grade.  
4. **Hover Preview:** Ao passar o mouse sobre o card de uma disciplina nas opções, a aplicação deve projetar uma "sombra" semitransparente no calendário, preenchendo *todos* os horários que aquela disciplina ocupará na semana.  
5. **Alerta de Conflito no Hover:** Se a sombra projetada se sobrepuser a um horário que já possui uma disciplina fixada, a sombra daquele horário específico deve ficar **vermelha**.  
6. **Fixação:** Ao clicar no card nas opções, a disciplina é adicionada ao estado da grade, some da lista de opções, e é renderizada de forma opaca nas células correspondentes.

### **5.2. Gestão de Conflitos na Grade**

* Se o usuário ignorar o aviso vermelho e adicionar uma disciplina que conflita com outra, a célula do calendário onde ocorre o conflito deve **dividir-se visualmente** (ex: layout flex com 50% de largura para cada ou empilhados verticalmente), mostrando ambos os cards.

### **5.3. Remoção de Disciplinas**

* Cada card de disciplina já fixado na grade deve ter um ícone de "3 pontos" (kebab menu) no canto superior. Ao clicar, exibe-se a opção "Remover", que deleta a disciplina do estado atual.

### **5.4. Filtros do Painel de Opções**

No painel de opções de disciplinas, o sistema deve exibir os seguintes recursos de busca e filtro:

* **Barra de Busca Textual:** Um input para pesquisar disciplinas por nome ou código de forma livre.
* **Selects e UI:** Os selects de filtro devem ter cores de placeholder adequadas e fáceis de ler.
* **Filtros de Situação:**  
  * **![][image1]**Mostrar apenas disciplinas que **não tenham conflito** com a grade atual.  
  * ![][image1]Mostrar apenas **Eletivas**.  
  * ![][image1]Mostrar apenas **Obrigatórias**.  
* **Filtro de Curso:** Dropdown ou botões selecionáveis com os cursos disponíveis (EC, CC, IA, SI).  
* **Filtro de Período:** Dropdown ou input numérico (ex: 1, 2, 3...) para filtrar as disciplinas pertencentes ao semestre/período ideal mapeado no CSV.

## **6\. Funcionalidades Extras**

* **Exportação:** Botão "Exportar Calendário" que converte a visualização do grid atual em uma imagem (PNG/JPG) e inicia o download. Deve garantir que o calendário esteja visível e formatado corretamente na imagem.

## **7\. Anexo Técnico: Parser de Horários (TypeScript)**

Utilize a função abaixo para processar a coluna Horário (Sala/Lab) do CSV, garantindo a extração da sala e a remoção automática do horário de almoço.

export type ParsedClassBlock \= {  
  day: string;       // 'seg', 'ter', 'qua', 'qui', 'sex'  
  startTime: string; // '08:00', '10:00', '13:00', '15:00', '17:00', '19:00'  
  endTime: string;   // '09:50', '11:50', '14:50', '16:50', '18:50', '20:30'  
  room: string | null; // Ex: 'E112', 'Grad05'  
};

/\*\*  
 \* Faz o parse da string de horários vinda do CSV.  
 \* Lida com separadores irregulares (barras ou espaços) e extrai a sala.  
 \*/  
export function parseScheduleString(rawString: string): ParsedClassBlock\[\] {  
  if (\!rawString) return \[\];

  const regex \= /(seg|ter|qua|qui|sex)\\.?\\s\*(\\d{2}:\\d{2})-(\\d{2}:\\d{2})\\s\*(?:\\((\[^)\]+)\\))?/gi;  
  const results: ParsedClassBlock\[\] \= \[\];  
  let match;

  while ((match \= regex.exec(rawString)) \!== null) {  
    const day \= match\[1\].toLowerCase();  
    const startTime \= match\[2\];  
    const endTime \= match\[3\];  
    const room \= match\[4\] ? match\[4\].trim() : null;

    // Regra de Negócio: Ignorar o "horário fantasma"  
    if (startTime \=== '12:00' && endTime \=== '12:50') {  
      continue;  
    }

    results.push({ day, startTime, endTime, room });  
  }

  return results;  
}  


[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAUCAYAAAAwe2GgAAABaUlEQVR4AezWsQ3DMAwEwMD7D5JNslMaewEXNiRCeukCpAkC+n1k8cf39z99GbgBN+AG3IAbcANuYN4bOD4+BAgQIECgWcAAAgQqBRS2Sl2zCRAgQIAAAQIdBBS2DohGZAhISYAAAQIEUgUUttTNyU2AAAECBAiMEBjyTIVtCLuHEiBAgAABAgSeCyhsz638kwABAhkCUhIgsJyAwrbcSr0QAQIECBAgsJqAwrbaRjPeR0oCBAgQIEDghYDC9gLLXwkQIECAAIGZBPbJorDts2tvSoAAAQIECIQKKGyhixObAIEMASkJECDQQ0Bh66FoBgECBAgQIECgUEBhK8TNGC0lAQIECBAgMLuAwjb7huQjQIAAAQIJAjKWCihspbyGEyBAgAABAgTaBRS2dkMTCBDIEJCSAAECsQIKW+zqBCdAgAABAgR2EVDYZtq0LAQIECBAgACBGwGF7QbFTwQIECBAIFlA9vUELgAAAP//o9TzxwAAAAZJREFUAwDOW0CBKt/PuQAAAABJRU5ErkJggg==>