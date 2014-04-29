class SiteController < ApplicationController
  caches_page :produtos, :c_c, :abx, :index, :blog2 ,:blog
  def index
  end

  def form
    @titulo = "[Orcamento] "+ params[:email] 
    ContactMailer.email_form(params[:name],params[:email],params[:telefone],params[:coment],@titulo).deliver
    flash[:notice] = "Email enviado com sucesso"
    redirect_to '/index'
  end

end
