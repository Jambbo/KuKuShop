package kukuxer.KuKushop.controller;

import kukuxer.KuKushop.dto.CommentDto;
import kukuxer.KuKushop.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

@Controller
@RequestMapping("/api/v1/comment")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/create")
    public ResponseEntity<?> createComment(
            @RequestBody CommentDto commentDto,
            @AuthenticationPrincipal Jwt jwt
    ){
        commentService.createComment(commentDto, jwt);
        return ResponseEntity.ok().build();
    }

}
