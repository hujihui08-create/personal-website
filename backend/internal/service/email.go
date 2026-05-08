package service

import (
	"bytes"
	"fmt"
	"net/smtp"
	"portfolio-backend/internal/config"

	"github.com/go-resty/resty/v2"
)

type EmailService struct {
	config config.EmailConfig
	client *resty.Client
}

type BrevoEmailRequest struct {
	Sender      BrevoSender `json:"sender"`
	To          []BrevoTo   `json:"to"`
	Subject     string      `json:"subject"`
	HTMLContent string      `json:"htmlContent"`
	TextContent string      `json:"textContent"`
}

type BrevoSender struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type BrevoTo struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

func NewEmailService(cfg config.EmailConfig) *EmailService {
	return &EmailService{
		config: cfg,
		client: resty.New(),
	}
}

func (s *EmailService) SendEmail(to, subject, htmlBody, textBody string) error {
	if s.config.Provider == "brevo" {
		return s.sendViaBrevo(to, subject, htmlBody, textBody)
	} else if s.config.Provider == "smtp" {
		return s.sendViaSMTP(to, subject, htmlBody, textBody)
	}
	return fmt.Errorf("unsupported email provider: %s", s.config.Provider)
}

func (s *EmailService) sendViaBrevo(to, subject, htmlBody, textBody string) error {
	if s.config.APIKey == "" {
		return fmt.Errorf("brevo API key not configured")
	}

	req := BrevoEmailRequest{
		Sender: BrevoSender{
			Name:  s.config.FromName,
			Email: s.config.FromEmail,
		},
		To: []BrevoTo{
			{Email: to},
		},
		Subject:     subject,
		HTMLContent: htmlBody,
		TextContent: textBody,
	}

	resp, err := s.client.R().
		SetHeader("api-key", s.config.APIKey).
		SetHeader("Content-Type", "application/json").
		SetBody(req).
		Post("https://api.brevo.com/v3/smtp/email")

	if err != nil {
		return fmt.Errorf("brevo API request failed: %w", err)
	}

	if resp.StatusCode() < 200 || resp.StatusCode() >= 300 {
		return fmt.Errorf("brevo API returned status %d: %s", resp.StatusCode(), string(resp.Body()))
	}

	return nil
}

func (s *EmailService) sendViaSMTP(to, subject, htmlBody, textBody string) error {
	if s.config.SMTPHost == "" || s.config.SMTPPort == 0 {
		return fmt.Errorf("SMTP configuration not complete")
	}

	auth := smtp.PlainAuth("", s.config.SMTPUser, s.config.SMTPPassword, s.config.SMTPHost)

	msg := s.buildEmailMessage(to, subject, htmlBody, textBody)

	addr := fmt.Sprintf("%s:%d", s.config.SMTPHost, s.config.SMTPPort)
	err := smtp.SendMail(addr, auth, s.config.FromEmail, []string{to}, msg)
	if err != nil {
		return fmt.Errorf("SMTP send failed: %w", err)
	}

	return nil
}

func (s *EmailService) buildEmailMessage(to, subject, htmlBody, textBody string) []byte {
	buf := bytes.NewBuffer(nil)

	fmt.Fprintf(buf, "From: %s <%s>\r\n", s.config.FromName, s.config.FromEmail)
	fmt.Fprintf(buf, "To: %s\r\n", to)
	fmt.Fprintf(buf, "Subject: %s\r\n", subject)
	fmt.Fprintf(buf, "MIME-version: 1.0;\r\n")
	fmt.Fprintf(buf, "Content-Type: multipart/alternative; boundary=\"boundary\"\r\n")
	fmt.Fprintf(buf, "\r\n")
	fmt.Fprintf(buf, "--boundary\r\n")
	fmt.Fprintf(buf, "Content-Type: text/plain; charset=\"UTF-8\"\r\n")
	fmt.Fprintf(buf, "\r\n")
	fmt.Fprintf(buf, "%s\r\n", textBody)
	fmt.Fprintf(buf, "\r\n")
	fmt.Fprintf(buf, "--boundary\r\n")
	fmt.Fprintf(buf, "Content-Type: text/html; charset=\"UTF-8\"\r\n")
	fmt.Fprintf(buf, "\r\n")
	fmt.Fprintf(buf, "%s\r\n", htmlBody)
	fmt.Fprintf(buf, "\r\n")
	fmt.Fprintf(buf, "--boundary--\r\n")

	return buf.Bytes()
}

func (s *EmailService) SendNewBookingNotification(companyName, companyLocation, bookingDate, bookingTime, contactEmail, contactPhone, notes string) error {
	if s.config.AdminEmail == "" {
		return fmt.Errorf("admin email not configured")
	}

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>新预约通知</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1A1A1A;">🎉 新预约通知</h2>
        <p>你好，</p>
        <p><strong>%s</strong> (%s) 预约了面试！</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>预约时间：</strong>%s %s</p>
            <p><strong>公司名称：</strong>%s</p>
            <p><strong>公司地点：</strong>%s</p>
            <p><strong>联系邮箱：</strong>%s</p>
            <p><strong>联系电话：</strong>%s</p>
            %s
        </div>
        
        <p>请登录管理后台查看详情并确认。</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
</body>
</html>
`, companyName, companyLocation, bookingDate, bookingTime, companyName, companyLocation, contactEmail, contactPhone, func() string {
		if notes != "" {
			return fmt.Sprintf("<p><strong>备注：</strong>%s</p>", notes)
		}
		return ""
	}())

	textBody := fmt.Sprintf(`
新预约通知

%s (%s) 预约了面试！

预约时间：%s %s
公司名称：%s
公司地点：%s
联系邮箱：%s
联系电话：%s
%s

请登录管理后台查看详情并确认。

此邮件由系统自动发送，请勿回复。
`, companyName, companyLocation, bookingDate, bookingTime, companyName, companyLocation, contactEmail, contactPhone, func() string {
		if notes != "" {
			return fmt.Sprintf("备注：%s", notes)
		}
		return ""
	}())

	return s.SendEmail(s.config.AdminEmail, "[个人网站] 收到新的面试预约", htmlBody, textBody)
}

func (s *EmailService) SendBookingConfirmedNotification(companyName, bookingDate, bookingTime string, contactEmail string) error {
	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>预约已确认</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10B981;">✅ 预约已确认</h2>
        <p>%s，你好！</p>
        <p>你的面试预约已确认！</p>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>预约时间：</strong>%s %s</p>
        </div>
        
        <p>如有变更，请及时联系。</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
</body>
</html>
`, companyName, bookingDate, bookingTime)

	textBody := fmt.Sprintf(`
预约已确认

%s，你好！

你的面试预约已确认！

预约时间：%s %s

如有变更，请及时联系。

此邮件由系统自动发送，请勿回复。
`, companyName, bookingDate, bookingTime)

	return s.SendEmail(contactEmail, "[个人网站] 面试预约已确认", htmlBody, textBody)
}

func (s *EmailService) SendBookingRejectedNotification(companyName string, contactEmail, rejectReason string) error {
	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>预约已拒绝</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #EF4444;">❌ 预约已拒绝</h2>
        <p>%s，你好！</p>
        <p>很抱歉，你的面试预约已被拒绝。</p>
        %s
        <p>如有疑问，请通过其他方式联系。</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
</body>
</html>
`, companyName, func() string {
		if rejectReason != "" {
			return fmt.Sprintf(`
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>拒绝原因：</strong>%s</p>
        </div>
`, rejectReason)
		}
		return ""
	}())

	textBody := fmt.Sprintf(`
预约已拒绝

%s，你好！

很抱歉，你的面试预约已被拒绝。
%s
如有疑问，请通过其他方式联系。

此邮件由系统自动发送，请勿回复。
`, companyName, func() string {
		if rejectReason != "" {
			return fmt.Sprintf("\n拒绝原因：%s\n", rejectReason)
		}
		return ""
	}())

	return s.SendEmail(contactEmail, "[个人网站] 面试预约已拒绝", htmlBody, textBody)
}
