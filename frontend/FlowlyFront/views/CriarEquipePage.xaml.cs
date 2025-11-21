using FlowlyFront.services;
using System;

namespace FlowlyFront.views;

[QueryProperty(nameof(EquipeId), "EquipeId")]
[QueryProperty(nameof(InitialNome), "InitialNome")]
[QueryProperty(nameof(InitialDescricao), "InitialDescricao")]
[QueryProperty(nameof(InitialVinculo), "InitialVinculo")]
public partial class CriarEquipePage : ContentPage
{
    private readonly ApiService _api = new ApiService();
    public string EquipeId { get; set; }
    public string InitialNome { get; set; }
    public string InitialDescricao { get; set; }
    public string InitialVinculo { get; set; }

    public CriarEquipePage()
    {
        InitializeComponent();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        // Se vier com parâmetros, entra em modo edição
        if (!string.IsNullOrWhiteSpace(EquipeId))
        {
            HeaderLabel.Text = "Editar equipe";
            ConfirmButton.Text = "Salvar alterações";

            NomeEntry.Text = InitialNome ?? string.Empty;
            DescricaoEntry.Text = InitialDescricao ?? string.Empty;

            if (!string.IsNullOrWhiteSpace(InitialVinculo))
            {
                VinculoSimRadio.IsChecked = true;
                VinculoEntry.IsEnabled = true;
                VinculoEntry.Text = InitialVinculo;
            }
            else
            {
                VinculoNaoRadio.IsChecked = true;
                VinculoEntry.IsEnabled = false;
                VinculoEntry.Text = string.Empty;
            }
        }
        else
        {
            HeaderLabel.Text = "Criar equipe";
            ConfirmButton.Text = "Criar equipe";
        }
    }

    private void OnVinculoCheckedChanged(object sender, CheckedChangedEventArgs e)
    {
        VinculoEntry.IsEnabled = VinculoSimRadio.IsChecked;
        if (!VinculoSimRadio.IsChecked)
        {
            VinculoEntry.Text = string.Empty;
        }
    }

    private async void OnCriarEquipeConfirmClicked(object sender, EventArgs e)
    {
        MessageLabel.IsVisible = false;
        MessageLabel.Text = string.Empty;

        var nome = NomeEntry.Text?.Trim();
        var descricao = DescricaoEntry.Text?.Trim();
        var vinculo = VinculoSimRadio.IsChecked ? VinculoEntry.Text?.Trim() : null;

        if (string.IsNullOrWhiteSpace(nome))
        {
            ShowMessage("Informe o nome da equipe.", true);
            return;
        }

        try
        {
            if (!string.IsNullOrWhiteSpace(EquipeId))
            {
                var (ok, msg, equipe) = await _api.EditarEquipeAsync(EquipeId, nome, descricao, vinculo);
                if (ok && equipe != null)
                {
                    ShowMessage("Equipe editada com sucesso!", false);
                    await Task.Delay(800);
                    await Shell.Current.GoToAsync(nameof(MinhasEquipesPage));
                }
                else
                {
                    ShowMessage(msg ?? "Falha ao editar equipe.", true);
                }
            }
            else
            {
                var (ok, msg, equipe) = await _api.CriarEquipeAsync(nome, descricao, vinculo);
                if (ok && equipe != null)
                {
                    ShowMessage("Equipe criada com sucesso!", false);
                    await Task.Delay(800);
                    await Shell.Current.GoToAsync(nameof(MinhasEquipesPage));
                }
                else
                {
                    ShowMessage(msg ?? "Falha ao criar equipe.", true);
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