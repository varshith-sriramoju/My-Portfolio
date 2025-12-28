package in.varshith.My_Portfolio.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;

@Controller
public class HomeController {
    @GetMapping({"/", "", "/home"})
    public String showHomePage() {
        return "home";
    }

    // Serve resume PDF from classpath: src/main/resources/resume/VarshithResume.pdf
    @GetMapping("/resume")
    public ResponseEntity<Resource> getResume(@RequestParam(name = "download", required = false, defaultValue = "false") boolean download) {
        Resource pdf = new ClassPathResource("resume/VarshithResume.pdf");
        if (!pdf.exists()) {
            return ResponseEntity.notFound().build();
        }
        String disposition = download ? "attachment; filename=VarshithResume.pdf" : "inline; filename=VarshithResume.pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // Resume viewer page with iframe + fallback download link
    @GetMapping("/resume/view")
    public String viewResume() {
        return "resume"; // templates/resume.html
    }

    @GetMapping("/resume.pdf")
    public ResponseEntity<Resource> getResumePdfAlias() throws IOException {
        ClassPathResource pdf = new ClassPathResource("resume/VarshithResume.pdf");
        if (!pdf.exists()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=VarshithResume.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(pdf.getInputStream()));
    }

    @GetMapping("/files/resume")
    public ResponseEntity<Resource> getResumeFilesAlias() {
        Resource pdf = new ClassPathResource("resume/VarshithResume.pdf");
        if (!pdf.exists()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=VarshithResume.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
