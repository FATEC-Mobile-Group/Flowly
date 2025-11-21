using System;
using System.Collections.ObjectModel;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Maui.Controls;
using FlowlyFront.services;

namespace FlowlyFront.views
{
    [QueryProperty(nameof(ProjetoId), nameof(ProjetoId))]
    [QueryProperty(nameof(ProjetoNome), nameof(ProjetoNome))]
    [QueryProperty(nameof(ProjetoDescricao), nameof(ProjetoDescricao))]
    [QueryProperty(nameof(EquipeId), nameof(EquipeId))]
    public partial class ProjetoDetalhesPage : ContentPage
    {
        private readonly ApiService _api = new ApiService();

        public string ProjetoId { get; set; }
        public string ProjetoNome { get; set; }
        public string ProjetoDescricao { get; set; }
        public string EquipeId { get; set; }

        private ObservableCollection<ApiService.TarefaDto> _tarefas = new();
        private ObservableCollection<ApiService.MembroNomeDto> _membros = new();
        private ApiService.UserBasic _usuarioAtual;

        private ObservableCollection<ApiService.TarefaDto> _tarefasNaoAssociadas = new();
        private ObservableCollection<ApiService.TarefaDto> _minhasTarefas = new();
        private ObservableCollection<ApiService.TarefaDto> _tarefasEmAndamento = new();

        public ProjetoDetalhesPage()
        {
            InitializeComponent();
        }

        protected override async void OnAppearing()
        {
            base.OnAppearing();
            if (!string.IsNullOrWhiteSpace(ProjetoNome))
            {
                TituloLabel.Text = ProjetoNome;
            }
            DrawerDescricaoLabel.Text = ProjetoDescricao ?? string.Empty;

            try
            {
                var meResp = await _api.GetMeAsync();
                _usuarioAtual = meResp.success ? meResp.user : null;

                var todas = await _api.ListarTarefasPublicasAsync();
                var doProjeto = todas.Where(t => t.projeto == ProjetoId).ToList();
                _tarefas = new ObservableCollection<ApiService.TarefaDto>(doProjeto);
                AgruparTarefas();
                NaoAssociadasCollection.ItemsSource = _tarefasNaoAssociadas;
                MinhasCollection.ItemsSource = _minhasTarefas;
                EmAndamentoCollection.ItemsSource = _tarefasEmAndamento;

                if (!string.IsNullOrWhiteSpace(EquipeId))
                {
                    var membros = await _api.ObterMembrosEquipeAsync(EquipeId);
                    _membros = new ObservableCollection<ApiService.MembroNomeDto>(membros);
                    MembrosCollection.ItemsSource = _membros;
                }

                AtualizarStats();
            }
            catch (Exception ex)
            {
                await DisplayAlert("Erro", $"Falha ao carregar dados: {ex.Message}", "OK");
            }
        }

        void AgruparTarefas()
        {
            _tarefasNaoAssociadas = new ObservableCollection<ApiService.TarefaDto>(_tarefas.Where(t => string.IsNullOrEmpty(t.associado)));
            var meuId = _usuarioAtual?.id;
            _minhasTarefas = new ObservableCollection<ApiService.TarefaDto>(_tarefas.Where(t => !string.IsNullOrEmpty(t.associado) && t.associado == meuId));
            _tarefasEmAndamento = new ObservableCollection<ApiService.TarefaDto>(_tarefas.Where(t => t.status == "em_andamento"));
        }

        void AtualizarStats()
        {
            int concluidas = _tarefas.Count(t => t.status == "concluido");
            int pendentes = _tarefas.Count(t => t.status == "pendente");
            int andamento = _tarefas.Count(t => t.status == "em_andamento");

            ConcluidasLabel.Text = $"Concluídas: {concluidas}";
            PendentesLabel.Text = $"Pendentes: {pendentes}";
            EmAndamentoLabel.Text = $"Em andamento: {andamento}";
        }

        void MostrarAba(string aba)
        {
            TarefasView.IsVisible = aba == "tarefas";
            MembrosView.IsVisible = aba == "membros";
            StatsView.IsVisible = aba == "stats";
        }

        private void OnTabTarefasClicked(object sender, EventArgs e) => MostrarAba("tarefas");
        private void OnTabMembrosClicked(object sender, EventArgs e) => MostrarAba("membros");
        private void OnTabStatsClicked(object sender, EventArgs e) => MostrarAba("stats");

        private async void OnAdicionarTarefaClicked(object sender, EventArgs e)
        {
            var parametros = new Dictionary<string, object>
            {
                { nameof(CriarTarefaPage.ProjetoId), ProjetoId },
                { nameof(CriarTarefaPage.ProjetoNome), ProjetoNome }
            };
            await Shell.Current.GoToAsync(nameof(CriarTarefaPage), parametros);
        }

        private async void OnTarefaTapped(object sender, EventArgs e)
        {
            var border = sender as VisualElement;
            var tarefa = border?.BindingContext as ApiService.TarefaDto;
            if (tarefa == null) return;
            var parametros = new Dictionary<string, object>
            {
                { nameof(TarefaDetalhesPage.TarefaId), tarefa._id },
                { nameof(TarefaDetalhesPage.TarefaNome), tarefa.nome },
                { nameof(TarefaDetalhesPage.TarefaDescricao), tarefa.descricao },
                { nameof(TarefaDetalhesPage.TarefaStatus), tarefa.status },
                { nameof(TarefaDetalhesPage.TarefaPrazo), tarefa.prazo.ToString("o") },
                { nameof(TarefaDetalhesPage.TarefaDificuldade), tarefa.dificuldade },
                { nameof(TarefaDetalhesPage.TarefaPrioridade), tarefa.prioridade },
                { nameof(TarefaDetalhesPage.TarefaAssociado), tarefa.associado },
                { nameof(TarefaDetalhesPage.ProjetoId), EquipeId },
            };
            await Shell.Current.GoToAsync(nameof(TarefaDetalhesPage), parametros);
        }

        private async void OnHamburguerClicked(object sender, EventArgs e)
        {
            DrawerOverlay.IsVisible = true;
            await Task.Delay(10);
        }

        private void OnInfoEquipeClicked(object sender, EventArgs e)
        {
            // Placeholder: poderemos navegar para detalhes da equipe
            DrawerOverlay.IsVisible = false;
        }

        private async void OnMinhasEquipesClicked(object sender, EventArgs e)
        {
            DrawerOverlay.IsVisible = false;
            await Shell.Current.GoToAsync(nameof(MinhasEquipesPage));
        }

        private async void OnSairProjetoClicked(object sender, EventArgs e)
        {
            DrawerOverlay.IsVisible = false;
            bool confirmar = await DisplayAlert("Sair do projeto", "Tem certeza que deseja sair?", "Sim", "Não");
            if (confirmar) await Shell.Current.GoToAsync("..");
        }

        private void OnDrawerOverlayTapped(object sender, EventArgs e)
        {
            DrawerOverlay.IsVisible = false;
        }

        private async void OnVoltarClicked(object sender, EventArgs e)
        {
            await Shell.Current.GoToAsync("..");
        }
    }
}