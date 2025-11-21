using System;
using System.Collections.ObjectModel;
using FlowlyFront.services;

namespace FlowlyFront.views;

[QueryProperty(nameof(EquipeId), "EquipeId")]
[QueryProperty(nameof(EquipeNome), "EquipeNome")]
public partial class ProjetosPage : ContentPage
{
    private readonly ApiService _api = new ApiService();
    public string EquipeId { get; set; }
    public string EquipeNome { get; set; }

    private ObservableCollection<ApiService.Projeto> _todosProjetos = new();

    public ProjetosPage()
    {
        InitializeComponent();
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        EquipeNomeLabel.Text = !string.IsNullOrWhiteSpace(EquipeNome) ? EquipeNome : "Nome da equipe";
        await CarregarProjetosAsync();
    }

    private async Task CarregarProjetosAsync()
    {
        try
        {
            MessageLabel.IsVisible = false;
            MessageLabel.Text = string.Empty;

            var (ok, msg, projetos) = await _api.ListarProjetosAsync(EquipeId);
            if (!ok || projetos == null)
            {
                MessageLabel.TextColor = Color.FromArgb("#E04B4B");
                MessageLabel.Text = msg ?? "Não foi possível carregar projetos.";
                MessageLabel.IsVisible = true;
                ProjetosCollection.ItemsSource = null;
                return;
            }
            _todosProjetos = new ObservableCollection<ApiService.Projeto>(projetos);
            ProjetosCollection.ItemsSource = _todosProjetos;
        }
        catch (Exception ex)
        {
            MessageLabel.Text = $"Erro ao carregar projetos: {ex.Message}";
            MessageLabel.TextColor = Color.FromArgb("#E04B4B");
            MessageLabel.IsVisible = true;
        }
    }

    // Busca local removida conforme solicitação

    private async void OnBackClicked(object sender, EventArgs e)
    {
        await Shell.Current.GoToAsync("..");
    }

    private async void OnProjetoTapped(object sender, TappedEventArgs e)
    {
        var projeto = e.Parameter as ApiService.Projeto ?? (sender as VisualElement)?.BindingContext as ApiService.Projeto;
        if (projeto == null) return;
        var parametros = new Dictionary<string, object>
        {
            { nameof(ProjetoDetalhesPage.ProjetoId), projeto._id },
            { nameof(ProjetoDetalhesPage.ProjetoNome), projeto.nome },
            { nameof(ProjetoDetalhesPage.ProjetoDescricao), projeto.descricao },
            { nameof(ProjetoDetalhesPage.EquipeId), EquipeId },
        };
        await Shell.Current.GoToAsync(nameof(ProjetoDetalhesPage), parametros);
    }

    private async void OnCriarProjetoClicked(object sender, EventArgs e)
    {
        var url = $"{nameof(CriarProjetoPage)}?EquipeId={Uri.EscapeDataString(EquipeId ?? string.Empty)}&EquipeNome={Uri.EscapeDataString(EquipeNome ?? string.Empty)}";
        await Shell.Current.GoToAsync(url);
    }

    private async void OnProjetoMenuTapped(object sender, TappedEventArgs e)
    {
        var projeto = e.Parameter as ApiService.Projeto ?? (sender as VisualElement)?.BindingContext as ApiService.Projeto;
        if (projeto == null) return;

        var action = await DisplayActionSheet("Ações do projeto", "Cancelar", null, "Editar", "Excluir");
        if (action == "Editar")
        {
            var url = $"{nameof(CriarProjetoPage)}?EquipeId={Uri.EscapeDataString(EquipeId ?? string.Empty)}&EquipeNome={Uri.EscapeDataString(EquipeNome ?? string.Empty)}&ProjetoId={Uri.EscapeDataString(projeto._id ?? string.Empty)}&InitialNome={Uri.EscapeDataString(projeto.nome ?? string.Empty)}&InitialDescricao={Uri.EscapeDataString(projeto.descricao ?? string.Empty)}";
            await Shell.Current.GoToAsync(url);
        }
        else if (action == "Excluir")
        {
            var confirm = await DisplayAlert("Excluir projeto", $"Tem certeza que deseja excluir '{projeto.nome ?? "este projeto"}'?", "Excluir", "Cancelar");
            if (!confirm) return;
            try
            {
                var (ok, msg) = await _api.ExcluirProjetoAsync(projeto._id);
                if (ok)
                {
                    MessageLabel.TextColor = Color.FromArgb("#2ECC71");
                    MessageLabel.Text = "Projeto excluído com sucesso.";
                    MessageLabel.IsVisible = true;
                    await CarregarProjetosAsync();
                }
                else
                {
                    MessageLabel.TextColor = Color.FromArgb("#E04B4B");
                    MessageLabel.Text = msg ?? "Falha ao excluir projeto.";
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
}