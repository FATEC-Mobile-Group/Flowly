using System;
using System.Collections.ObjectModel;
using FlowlyFront.services;

namespace FlowlyFront.views;

public partial class MinhasEquipesPage : ContentPage
{
    private readonly ApiService _apiService = new ApiService();
    private ObservableCollection<ApiService.Equipe> _todasEquipes = new();

    public MinhasEquipesPage()
    {
        InitializeComponent();
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await CarregarEquipesAsync();
    }

    private async Task CarregarEquipesAsync()
    {
        try
        {
            MessageLabel.IsVisible = false;
            MessageLabel.Text = string.Empty;

            var (meOk, _, me) = await _apiService.GetMeAsync();
            var (ok, _, equipes) = await _apiService.ListarEquipesAsync();
            if (!ok || equipes == null)
            {
                MessageLabel.TextColor = Color.FromArgb("#E04B4B");
                MessageLabel.Text = "Não foi possível carregar as equipes.";
                MessageLabel.IsVisible = true;
                EquipesCollection.ItemsSource = null;
                return;
            }
            var meuId = meOk ? me?.id : null;
            var somenteMinhas = equipes;
            if (!string.IsNullOrWhiteSpace(meuId))
            {
                somenteMinhas = equipes.FindAll(eq =>
                    eq.membros != null && eq.membros.Exists(m => string.Equals(m.user, meuId, StringComparison.OrdinalIgnoreCase))
                );
            }
            _todasEquipes = new ObservableCollection<ApiService.Equipe>(somenteMinhas);
            EquipesCollection.ItemsSource = _todasEquipes;
        }
        catch (Exception ex)
        {
            MessageLabel.Text = $"Erro ao carregar equipes: {ex.Message}";
            MessageLabel.TextColor = Color.FromArgb("#E04B4B");
            MessageLabel.IsVisible = true;
        }
    }

    // Campo de busca removido conforme solicitação

    private async void OnBackClicked(object sender, EventArgs e)
    {
        await Shell.Current.GoToAsync("..");
    }

    private async void OnEquipeTapped(object sender, TappedEventArgs e)
    {
        var equipe = e.Parameter as ApiService.Equipe ?? (sender as VisualElement)?.BindingContext as ApiService.Equipe;
        if (equipe == null) return;
        var url = $"{nameof(ProjetosPage)}?EquipeId={Uri.EscapeDataString(equipe._id ?? string.Empty)}&EquipeNome={Uri.EscapeDataString(equipe.nome ?? string.Empty)}";
        await Shell.Current.GoToAsync(url);
    }

    private async void OnEquipeMenuTapped(object sender, TappedEventArgs e)
    {
        var equipe = e.Parameter as ApiService.Equipe ?? (sender as VisualElement)?.BindingContext as ApiService.Equipe;
        if (equipe == null)
            return;

        string id = equipe._id;
        string nome = equipe.nome;
        string descricao = equipe.descricao;
        string vinculo = equipe.vinculoEmpresarial;

        var action = await DisplayActionSheet("Ações da equipe", "Cancelar", null, "Editar", "Excluir");
        if (action == "Editar")
        {
            var url = $"{nameof(CriarEquipePage)}?EquipeId={Uri.EscapeDataString(id ?? string.Empty)}&InitialNome={Uri.EscapeDataString(nome ?? string.Empty)}&InitialDescricao={Uri.EscapeDataString(descricao ?? string.Empty)}&InitialVinculo={Uri.EscapeDataString(vinculo ?? string.Empty)}";
            await Shell.Current.GoToAsync(url);
        }
        else if (action == "Excluir")
        {
            var confirm = await DisplayAlert("Excluir equipe", $"Tem certeza que deseja excluir '{nome ?? "esta equipe"}'?", "Excluir", "Cancelar");
            if (!confirm) return;

            try
            {
                var (ok, msg) = await _apiService.ExcluirEquipeAsync(id);
                if (ok)
                {
                    MessageLabel.TextColor = Color.FromArgb("#2ECC71");
                    MessageLabel.Text = "Equipe excluída com sucesso.";
                    MessageLabel.IsVisible = true;
                    await CarregarEquipesAsync();
                }
                else
                {
                    MessageLabel.TextColor = Color.FromArgb("#E04B4B");
                    MessageLabel.Text = msg ?? "Falha ao excluir equipe.";
                    MessageLabel.IsVisible = true;
                }
            }
            catch (Exception ex)
            {
                MessageLabel.TextColor = Color.FromArgb("#E04B4B");
                MessageLabel.Text = $"Erro ao excluir: {ex.Message}";
                MessageLabel.IsVisible = true;
            }
        }
    }

    // Swipe handlers removidos e fluxo restaurado para action sheet nos três pontos

    // Removidos handlers de MenuFlyout por incompatibilidade no MAUI do seu projeto.

    private async void OnCriarEquipeClicked(object sender, EventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(CriarEquipePage));
    }
}