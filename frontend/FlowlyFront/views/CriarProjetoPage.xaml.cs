using FlowlyFront.services;
using System;
using System.Threading.Tasks;

namespace FlowlyFront.views;

[QueryProperty(nameof(EquipeId), "EquipeId")]
[QueryProperty(nameof(EquipeNome), "EquipeNome")]
[QueryProperty(nameof(ProjetoId), "ProjetoId")]
[QueryProperty(nameof(InitialNome), "InitialNome")]
[QueryProperty(nameof(InitialDescricao), "InitialDescricao")]
public partial class CriarProjetoPage : ContentPage
{
    private readonly ApiService _api = new ApiService();
    public string EquipeId { get; set; }
    public string EquipeNome { get; set; }
    public string ProjetoId { get; set; }
    public string InitialNome { get; set; }
    public string InitialDescricao { get; set; }

    public CriarProjetoPage()
    {
        InitializeComponent();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        var isEdit = !string.IsNullOrWhiteSpace(ProjetoId);
        HeaderLabel.Text = isEdit ? "Editar projeto" : "Criar projeto";
        EquipeContextLabel.Text = string.IsNullOrWhiteSpace(EquipeNome) ? string.Empty : $"Equipe: {EquipeNome}";
        ConfirmButton.Text = isEdit ? "Salvar alterações" : "Criar projeto";

        if (isEdit)
        {
            NomeEntry.Text = InitialNome ?? string.Empty;
            DescricaoEditor.Text = InitialDescricao ?? string.Empty;
        }
    }

    private async void OnCriarProjetoConfirmClicked(object sender, EventArgs e)
    {
        MessageLabel.IsVisible = false;
        MessageLabel.Text = string.Empty;

        var nome = NomeEntry.Text?.Trim();
        var descricao = DescricaoEditor.Text?.Trim();

        if (string.IsNullOrWhiteSpace(nome))
        {
            ShowMessage("Informe o nome do projeto.", true);
            return;
        }
        if (string.IsNullOrWhiteSpace(EquipeId))
        {
            ShowMessage("Equipe não informada para o projeto.", true);
            return;
        }

        try
        {
            var isEdit = !string.IsNullOrWhiteSpace(ProjetoId);
            if (isEdit)
            {
                var (ok, msg, projeto) = await _api.EditarProjetoAsync(ProjetoId, nome, descricao, EquipeId);
                if (ok && projeto != null)
                {
                    ShowMessage("Projeto atualizado com sucesso!", false);
                    await Task.Delay(600);
                    var url = $"{nameof(ProjetosPage)}?EquipeId={Uri.EscapeDataString(EquipeId)}&EquipeNome={Uri.EscapeDataString(EquipeNome ?? string.Empty)}";
                    await Shell.Current.GoToAsync(url);
                }
                else
                {
                    ShowMessage(msg ?? "Falha ao atualizar projeto.", true);
                }
            }
            else
            {
                var (ok, msg, projeto) = await _api.CriarProjetoAsync(nome, descricao, EquipeId);
                if (ok && projeto != null)
                {
                    ShowMessage("Projeto criado com sucesso!", false);
                    await Task.Delay(600);
                    var url = $"{nameof(ProjetosPage)}?EquipeId={Uri.EscapeDataString(EquipeId)}&EquipeNome={Uri.EscapeDataString(EquipeNome ?? string.Empty)}";
                    await Shell.Current.GoToAsync(url);
                }
                else
                {
                    ShowMessage(msg ?? "Falha ao criar projeto.", true);
                }
            }
        }
        catch (Exception ex)
        {
            ShowMessage($"Erro: {ex.Message}", true);
        }
    }

    private void ShowMessage(string text, bool isError)
    {
        MessageLabel.Text = text;
        MessageLabel.TextColor = isError ? Color.FromArgb("#E04B4B") : Color.FromArgb("#2ECC71");
        MessageLabel.IsVisible = true;
    }
}