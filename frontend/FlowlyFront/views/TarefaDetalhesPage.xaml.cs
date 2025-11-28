using System;
using System.Collections.Generic;
using FlowlyFront.services;

namespace FlowlyFront.views;

[QueryProperty(nameof(TarefaId), nameof(TarefaId))]
[QueryProperty(nameof(TarefaNome), nameof(TarefaNome))]
[QueryProperty(nameof(TarefaDescricao), nameof(TarefaDescricao))]
[QueryProperty(nameof(TarefaStatus), nameof(TarefaStatus))]
[QueryProperty(nameof(TarefaPrazo), nameof(TarefaPrazo))]
[QueryProperty(nameof(TarefaDificuldade), nameof(TarefaDificuldade))]
[QueryProperty(nameof(TarefaPrioridade), nameof(TarefaPrioridade))]
[QueryProperty(nameof(TarefaAssociado), nameof(TarefaAssociado))]
[QueryProperty(nameof(ProjetoId), nameof(ProjetoId))]
public partial class TarefaDetalhesPage : ContentPage
{
    private readonly ApiService _api = new ApiService();
    private ApiService.UserBasic _me;

    public string TarefaId { get; set; }
    public string TarefaNome { get; set; }
    public string TarefaDescricao { get; set; }
    public string TarefaStatus { get; set; }
    public string TarefaPrazo { get; set; }
    public string TarefaDificuldade { get; set; }
    public string TarefaPrioridade { get; set; }
    public string TarefaAssociado { get; set; }
    public string ProjetoId { get; set; }

    public TarefaDetalhesPage()
    {
        InitializeComponent();
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        TituloLabel.Text = TarefaNome ?? "Nome da tarefa";
        DescricaoLabel.Text = TarefaDescricao ?? string.Empty;
        DificuldadeLabel.Text = string.IsNullOrWhiteSpace(TarefaDificuldade) ? "Definir" : ToTitle(TarefaDificuldade);
        PrioridadeLabel.Text = string.IsNullOrWhiteSpace(TarefaPrioridade) ? "Definir" : ToTitle(TarefaPrioridade);
        StatusLabel.Text = ToStatusFriendly(TarefaStatus);
        DateTime prazo;
        if (DateTime.TryParse(TarefaPrazo, out prazo))
        {
            PrazoLabel.Text = $"Prazo: {prazo:dd/MM/yy}";
        }
        else
        {
            PrazoLabel.Text = "Prazo: -";
        }
        CriadaEmLabel.Text = DateTime.TryParse(TarefaPrazo, out prazo) ? $"Criada em {DateTime.Now:dd/MM/yy}" : ""; // placeholder

        var meResp = await _api.GetMeAsync();
        _me = meResp.success ? meResp.user : null;
        AtualizarEstadoAcao();
    }

    void AtualizarEstadoAcao()
    {
        var meId = _me?.id;
        var associado = TarefaAssociado;
        var status = TarefaStatus;
        if (string.IsNullOrWhiteSpace(associado))
        {
            AtribuicaoTitulo.Text = "Esta tarefa ainda não foi atribuída";
            AcaoButton.Text = "Pegar tarefa";
            AcaoButton.BackgroundColor = Color.FromArgb("#337BFF");
            AcaoButton.IsVisible = true;
        }
        else if (!string.IsNullOrWhiteSpace(meId) && associado == meId && status != "concluido")
        {
            AtribuicaoTitulo.Text = "Tarefa atribuída a você!";
            AcaoButton.Text = "Concluir tarefa";
            AcaoButton.BackgroundColor = Color.FromArgb("#2ECC71");
            AcaoButton.IsVisible = true;
        }
        else
        {
            AtribuicaoTitulo.Text = "Tarefa atribuída a:";
            AcaoButton.IsVisible = false;
        }
    }

    private async void OnAcaoButtonClicked(object sender, EventArgs e)
    {
        if (string.IsNullOrWhiteSpace(TarefaId)) return;
        var meId = _me?.id;
        if (string.IsNullOrWhiteSpace(TarefaAssociado))
        {
            var (ok, msg, tarefa) = await _api.AssociarTarefaAsync(TarefaId);
            if (!ok)
            {
                await DisplayAlert("Erro", msg, "OK");
                return;
            }
            if (tarefa != null)
            {
                TarefaAssociado = tarefa.associado;
                TarefaStatus = tarefa.status;
            }
            else
            {
                TarefaAssociado = meId;
                TarefaStatus = "em_andamento";
            }
            StatusLabel.Text = ToStatusFriendly(TarefaStatus);
            AtualizarEstadoAcao();
        }
        else
        {
            var (ok, msg, tarefa) = await _api.ConcluirTarefaAsync(TarefaId);
            if (!ok)
            {
                await DisplayAlert("Erro", msg, "OK");
                return;
            }
            TarefaStatus = tarefa?.status ?? "concluido";
            StatusLabel.Text = ToStatusFriendly(TarefaStatus);
            AtualizarEstadoAcao();
        }
    }

    private async void OnBackClicked(object sender, EventArgs e)
    {
        await Shell.Current.GoToAsync("..");
    }

    string ToTitle(string v)
    {
        if (string.IsNullOrWhiteSpace(v)) return v;
        return char.ToUpper(v[0]) + v.Substring(1).Replace("_", " ");
    }

    string ToStatusFriendly(string s)
    {
        return s switch
        {
            "pendente" => "Pendente",
            "em_andamento" => "Em andamento",
            "concluido" => "Concluída",
            _ => s
        };
    }
}